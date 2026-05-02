export interface Binding {
    binding_id: string;
    login_type: string;
    role_id: string;
    nickname: string;
    bind_time: number;
    is_primary: boolean;
}
export interface MerchantSubscription {
    group_id: string;
    channel_id?: string;
    platform?: string;
    mention_all: boolean;
    items: string[];
    last_push_round: string | null;
    last_matched_items: string[];
    updated_by: string;
}
export declare class UserManager {
    private store;
    constructor(dataDir: string);
    getUserBindings(userId: string): Binding[];
    getPrimaryBinding(userId: string): Binding | null;
    saveUserBindings(userId: string, bindings: Binding[]): void;
    addBinding(userId: string, binding: Binding): void;
    deleteUserBinding(userId: string, index: number): Binding | null;
    switchPrimary(userId: string, index: number): boolean;
    removeBindingById(userId: string, bindingId: string): boolean;
    getAllUsersBindings(): Record<string, Binding[]>;
}
export declare class MerchantSubscriptionManager {
    private store;
    constructor(dataDir: string);
    upsert(key: string, sub: MerchantSubscription): void;
    get(key: string): MerchantSubscription | null;
    delete(key: string): boolean;
    getAll(): Record<string, MerchantSubscription>;
}
