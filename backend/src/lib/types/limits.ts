
export interface LimitInput {
    rokBudzetowy: number;
    kodDepartamentu: string;
    dzialKod: string;
    rozdzialKod: string;
    grupaWydatkow: string;
    kwota: number;
}

export interface LimitDTO extends LimitInput {
    id: number;
}

export interface OdpowiedzAPI<T> {
    sukces: boolean;
    dane?: T;
    blad?: string;
}
