import { DefaultNamingStrategy, NamingStrategyInterface, Table } from 'typeorm';

/**
 * snake_case en BD, camelCase en TS.
 * Tablas en plural, FKs en formato fk_<tabla>_<columna>, índices ix_*.
 */
export class SnakeCaseNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  override tableName(targetName: string, userSpecifiedName?: string): string {
    return userSpecifiedName ?? this.snake(targetName);
  }

  override columnName(
    propertyName: string,
    customName?: string,
    embeddedPrefixes: string[] = [],
  ): string {
    const name = embeddedPrefixes.concat(customName ?? propertyName).join('_');
    return this.snake(name);
  }

  override relationName(propertyName: string): string {
    return this.snake(propertyName);
  }

  override joinColumnName(relationName: string, referencedColumnName: string): string {
    return this.snake(`${relationName}_${referencedColumnName}`);
  }

  override joinTableName(
    firstTableName: string,
    secondTableName: string,
    _firstPropertyName: string,
    _secondPropertyName: string,
  ): string {
    return this.snake(`${firstTableName}_${secondTableName}`);
  }

  override joinTableColumnName(
    tableName: string,
    propertyName: string,
    columnName?: string,
  ): string {
    return this.snake(`${tableName}_${columnName ?? propertyName}`);
  }

  override indexName(tableOrName: Table | string, columns: string[]): string {
    const table = typeof tableOrName === 'string' ? tableOrName : tableOrName.name;
    return `ix_${table}_${columns.join('_')}`;
  }

  override foreignKeyName(tableOrName: Table | string, columnNames: string[]): string {
    const table = typeof tableOrName === 'string' ? tableOrName : tableOrName.name;
    return `fk_${table}_${columnNames.join('_')}`;
  }

  override uniqueConstraintName(tableOrName: Table | string, columnNames: string[]): string {
    const table = typeof tableOrName === 'string' ? tableOrName : tableOrName.name;
    return `uq_${table}_${columnNames.join('_')}`;
  }

  private snake(str: string): string {
    return str
      .replace(/\.?([A-Z]+)/g, (_, y) => `_${(y as string).toLowerCase()}`)
      .replace(/^_/, '');
  }
}
