export interface Advice {
    subject: string;
    topic: string;
    content: string;
    category: string;
}

export interface TravelAdvice extends Advice {
    country: string;
    permalink: string;
    updated: string;
    still_current_at: string;
    line?: number;
}

export interface TravelAdviceSearchParams {
    country: string;
    subject: string;
    topic: string;
}

export interface RegionCase {
    region: string;
    date: string;
    totalNoOfCases: number;
    noOfCases: number;
    objectID: string;
}