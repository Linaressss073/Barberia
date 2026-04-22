import { Entity } from '@core/domain/entity';
import { UniqueEntityId } from '@core/domain/unique-entity-id';

interface RefreshTokenProps {
  userId: UniqueEntityId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  createdAt: Date;
}

export class RefreshToken extends Entity<RefreshTokenProps> {
  private constructor(props: RefreshTokenProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static issue(params: { userId: UniqueEntityId; tokenHash: string; ttlMs: number }): RefreshToken {
    return new RefreshToken({
      userId: params.userId,
      tokenHash: params.tokenHash,
      expiresAt: new Date(Date.now() + params.ttlMs),
      revokedAt: null,
      createdAt: new Date(),
    });
  }

  static rehydrate(props: RefreshTokenProps, id: UniqueEntityId): RefreshToken {
    return new RefreshToken(props, id);
  }

  get userId(): UniqueEntityId {
    return this.props.userId;
  }
  get tokenHash(): string {
    return this.props.tokenHash;
  }
  get expiresAt(): Date {
    return this.props.expiresAt;
  }
  get revokedAt(): Date | null | undefined {
    return this.props.revokedAt;
  }

  isActive(): boolean {
    return !this.props.revokedAt && this.props.expiresAt.getTime() > Date.now();
  }

  revoke(): void {
    this.props.revokedAt = new Date();
  }
}
