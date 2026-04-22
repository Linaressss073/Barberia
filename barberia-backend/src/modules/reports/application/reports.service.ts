import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class ReportsService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  /** Resumen diario de ventas en rango [from, to). */
  async dailySales(
    from: Date,
    to: Date,
  ): Promise<Array<{ day: string; sales: number; total_cents: number }>> {
    return this.ds.query(
      `SELECT date_trunc('day', closed_at)::date AS day,
              COUNT(*)::int                       AS sales,
              COALESCE(SUM(total_cents),0)::int   AS total_cents
         FROM sales
        WHERE status = 'CLOSED'
          AND closed_at >= $1 AND closed_at < $2
        GROUP BY 1
        ORDER BY 1`,
      [from, to],
    );
  }

  /** Top servicios vendidos (por unidades + monto). */
  async topServices(from: Date, to: Date, limit = 10) {
    return this.ds.query(
      `SELECT s.id, s.name,
              SUM(si.qty)::int          AS units,
              SUM(si.total_cents)::int  AS revenue_cents
         FROM sale_items si
         JOIN sales sa ON sa.id = si.sale_id AND sa.status = 'CLOSED'
                       AND sa.closed_at >= $1 AND sa.closed_at < $2
         JOIN services s ON s.id = si.service_id
        WHERE si.kind = 'SERVICE'
        GROUP BY s.id, s.name
        ORDER BY units DESC
        LIMIT $3`,
      [from, to, limit],
    );
  }

  /** Ocupación por barbero: % de minutos reservados vs minutos disponibles del rango. */
  async occupancyByBarber(from: Date, to: Date) {
    return this.ds.query(
      `SELECT b.id AS barber_id,
              b.display_name,
              COALESCE(SUM(EXTRACT(EPOCH FROM (a.ends_at - a.scheduled_at))/60), 0)::int AS booked_minutes,
              EXTRACT(EPOCH FROM ($2::timestamptz - $1::timestamptz))/60::int            AS range_minutes
         FROM barbers b
         LEFT JOIN appointments a
           ON a.barber_id = b.id
          AND a.status NOT IN ('CANCELLED','NO_SHOW')
          AND a.scheduled_at >= $1 AND a.scheduled_at < $2
        GROUP BY b.id, b.display_name
        ORDER BY booked_minutes DESC`,
      [from, to],
    );
  }

  /** Comisiones por barbero del periodo (sobre subtotal de servicios proporcionalmente). */
  async commissionsByBarber(from: Date, to: Date) {
    return this.ds.query(
      `WITH closed AS (
         SELECT sa.id, sa.barber_id, sa.subtotal_cents, sa.total_cents
           FROM sales sa
          WHERE sa.status = 'CLOSED' AND sa.closed_at >= $1 AND sa.closed_at < $2
       ),
       per_sale AS (
         SELECT c.barber_id,
                CASE WHEN c.subtotal_cents > 0
                     THEN c.total_cents
                       * COALESCE(SUM(CASE WHEN si.kind='SERVICE' THEN si.total_cents ELSE 0 END) FILTER (WHERE TRUE),0)
                       / NULLIF(c.subtotal_cents,0)
                     ELSE 0 END AS service_base
           FROM closed c
           LEFT JOIN sale_items si ON si.sale_id = c.id
          GROUP BY c.id, c.barber_id, c.subtotal_cents, c.total_cents
       )
       SELECT b.id AS barber_id, b.display_name, b.commission_pct,
              COALESCE(SUM(ps.service_base)::int, 0)                         AS base_cents,
              COALESCE(SUM(ps.service_base * b.commission_pct / 100)::int,0) AS commission_cents
         FROM per_sale ps
         JOIN barbers b ON b.id = ps.barber_id
        GROUP BY b.id, b.display_name, b.commission_pct
        ORDER BY commission_cents DESC`,
      [from, to],
    );
  }

  /** Clientes más frecuentes en el rango. */
  async topCustomers(from: Date, to: Date, limit = 10) {
    return this.ds.query(
      `SELECT c.id, c.full_name,
              COUNT(a.*)::int AS visits,
              COALESCE(SUM(s.total_cents),0)::int AS spent_cents
         FROM customers c
         LEFT JOIN appointments a
           ON a.customer_id = c.id
          AND a.status = 'COMPLETED'
          AND a.scheduled_at >= $1 AND a.scheduled_at < $2
         LEFT JOIN sales s
           ON s.customer_id = c.id
          AND s.status = 'CLOSED'
          AND s.closed_at >= $1 AND s.closed_at < $2
        GROUP BY c.id, c.full_name
        HAVING COUNT(a.*) > 0 OR COALESCE(SUM(s.total_cents),0) > 0
        ORDER BY spent_cents DESC
        LIMIT $3`,
      [from, to, limit],
    );
  }
}
