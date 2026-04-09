export interface Location {
    lat: number;
    lng: number;
}

export interface Agent {
    _id: string;
    name: string;
    location: Location;
    isAvailable: boolean;
}