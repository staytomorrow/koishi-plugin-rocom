export declare const EGG_GROUP_META: Record<number, {
    label: string;
    desc: string;
}>;
export declare function getEggGroupLabel(id: number): string;
export declare function formatEggGroups(ids: number[]): string;
export interface SearchResult {
    matchType: 'exact' | 'fuzzy' | 'multi' | 'not_found';
    pet?: any;
    candidates?: any[];
}
export declare class EggService {
    private pets;
    private byId;
    private byZh;
    private byEn;
    constructor(dataDir: string);
    private load;
    getEggGroups(pet: any): number[];
    search(keyword: string): SearchResult;
    searchBySize(height?: number, weight?: number): {
        perfect: any[];
        range: any[];
    };
    getCompatiblePets(pet: any): any[];
    getBreedingParents(pet: any): any[];
    evaluatePair(a: any, b: any): {
        compatible: boolean;
        reasons: string[];
        shared_egg_groups: number[];
        shared_egg_group_labels: string[];
        hatch_label: string;
        weight_label: string;
        height_label: string;
    };
    buildSizeSearchText(height?: number, weight?: number, results?: {
        perfect: any[];
        range: any[];
    }): string;
    buildSizeSearchTextFromApi(height?: number, weight?: number, results?: any): string;
    buildSearchText(pet: any): string;
    buildCandidatesText(keyword: string, candidates: any[]): string;
    buildWantPetText(pet: any): string;
    buildPairText(a: any, b: any): string;
    buildSearchData(pet: any): {
        pet_name: string;
        pet_id: any;
        pet_icon: string;
        pet_image: string;
        type_label: string;
        egg_groups_label: string;
        egg_groups: number[];
        egg_group_labels: {
            [k: string]: string;
        };
        male_rate: any;
        female_rate: any;
        hatch_label: string;
        weight_label: string;
        height_label: string;
        total_compatible: number;
        is_undiscovered: boolean;
        egg_group_sections: {
            id: number;
            label: string;
            desc: string;
            count: number;
            members: {
                name: string;
                id: any;
                type_label: string;
                egg_groups_label: string;
            }[];
            has_more: boolean;
            total: number;
        }[];
        total_stats: any;
        egg_details: {
            has_data: boolean;
            base_prob_str?: undefined;
            base_prob_pct?: undefined;
            add_prob_str?: undefined;
            add_prob_pct?: undefined;
            is_contact_add_glass?: undefined;
            is_contact_add_shining?: undefined;
            precious_egg_type?: undefined;
            precious_egg_label?: undefined;
            variants?: undefined;
            variant_count?: undefined;
        } | {
            has_data: boolean;
            base_prob_str: string;
            base_prob_pct: number;
            add_prob_str: string;
            add_prob_pct: number;
            is_contact_add_glass: any;
            is_contact_add_shining: any;
            precious_egg_type: any;
            precious_egg_label: string;
            variants: any;
            variant_count: any;
        };
        commandHint: string;
        copyright: string;
    };
    buildPairData(a: any, b: any): {
        commandHint: string;
        copyright: string;
        compatible: boolean;
        reasons: string[];
        shared_egg_groups: number[];
        shared_egg_group_labels: string[];
        hatch_label: string;
        weight_label: string;
        height_label: string;
        mother: {
            name: string;
            id: any;
            type_label: string;
            egg_groups_label: string;
        };
        father: {
            name: string;
            id: any;
            type_label: string;
            egg_groups_label: string;
        };
    };
    buildWantPetData(pet: any): {
        target: {
            id: any;
            name: string;
            icon: string;
            image: string;
            type_label: string;
            egg_groups_label: string;
        };
        egg_groups_label: string;
        female_rate: any;
        male_rate: any;
        is_undiscovered: boolean;
        fathers: {
            id: any;
            name: string;
            icon: string;
            image: string;
            type_label: string;
            egg_groups_label: string;
        }[];
        father_count: number;
        commandHint: string;
        copyright: string;
    };
    buildCandidatesRenderData(keyword: string, candidates: any[]): {
        keyword: string;
        count: number;
        candidates: {
            id: any;
            name: string;
            icon: string;
            image: string;
            type_label: string;
            egg_groups_label: string;
        }[];
        commandHint: string;
        copyright: string;
    };
    buildSizeSearchData(height?: number, weight?: number, results?: {
        perfect: any[];
        range: any[];
    }): {
        query_label: string;
        perfect_matches: {
            id: any;
            name: string;
            icon: string;
            image: string;
            type_label: string;
            egg_groups_label: string;
            height_label: string;
            weight_label: string;
        }[];
        range_matches: {
            id: any;
            name: string;
            icon: string;
            image: string;
            type_label: string;
            egg_groups_label: string;
            height_label: string;
            weight_label: string;
        }[];
        total_count: number;
        has_results: boolean;
        commandHint: string;
        copyright: string;
    };
    private buildEggDetails;
}
