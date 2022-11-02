import {firestore} from "firebase-admin";

export class Order {
    constructor(obj:any) {
        this._auftrags_nr = obj.auftrags_nr;
        this._details = obj.details;
        this._filial_nr = obj.filial_nr;
        this._last_update = obj.last_update;
        this._markt = obj.markt;
        this._orderOpen = obj.orderOpen;
        this._price = obj.price;
        this._registered = obj.registered;
        this._state = obj.state;
        this._status = obj.status;
        this._timestamp = obj.timestamp;
    }

    get auftrags_nr(): string {
        return this._auftrags_nr;
    }

    set auftrags_nr(value: string) {
        this._auftrags_nr = value;
    }

    get details(): string {
        return this._details;
    }

    set details(value: string) {
        this._details = value;
    }

    get filial_nr(): string {
        return this._filial_nr;
    }

    set filial_nr(value: string) {
        this._filial_nr = value;
    }

    get last_update(): string {
        return this._last_update;
    }

    set last_update(value: string) {
        this._last_update = value;
    }

    get markt(): string {
        return this._markt;
    }

    set markt(value: string) {
        this._markt = value;
    }

    get orderOpen(): boolean {
        return this._orderOpen;
    }

    set orderOpen(value: boolean) {
        this._orderOpen = value;
    }

    get price(): string {
        return this._price;
    }

    set price(value: string) {
        this._price = value;
    }

    get registered(): string {
        return this._registered;
    }

    set registered(value: string) {
        this._registered = value;
    }

    get state(): string {
        return this._state;
    }

    set state(value: string) {
        this._state = value;
    }

    get status(): string {
        return this._status;
    }

    set status(value: string) {
        this._status = value;
    }

    get timestamp(): FirebaseFirestore.Timestamp {
        return this._timestamp;
    }

    set timestamp(value: FirebaseFirestore.Timestamp) {
        this._timestamp = value;
    }

    private _auftrags_nr: string
    private _details: string
    private _filial_nr: string
    private _last_update: string
    private _markt: string
    private _orderOpen: boolean
    private _price: string
    private _registered: string
    private _state:string
    private _status:string
    private _timestamp: firestore.Timestamp
}