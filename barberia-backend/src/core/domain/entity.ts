import { UniqueEntityId } from './unique-entity-id';

/**
 * Entidad base. La igualdad se define por identidad, no por valor.
 * Las propiedades viven en la subclase mediante un objeto `props`.
 */
export abstract class Entity<TProps> {
  protected readonly _id: UniqueEntityId;
  protected readonly props: TProps;

  protected constructor(props: TProps, id?: UniqueEntityId) {
    this._id = id ?? new UniqueEntityId();
    this.props = props;
  }

  get id(): UniqueEntityId {
    return this._id;
  }

  equals(other?: Entity<TProps>): boolean {
    if (other === null || other === undefined) return false;
    if (this === other) return true;
    return this._id.equals(other._id);
  }
}
