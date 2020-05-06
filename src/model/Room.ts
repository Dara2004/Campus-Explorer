export class Room {
    // EBNF types vs. dataset types
    public fullname: string;
    public shortname: string;
    public number: string;
    public name: string;
    public address: string;
    public lat: number;
    public lon: number;
    public seats: number;
    public type: string;
    public furniture: string;
    public href: string;

    public constructor(fullname: string, shortname: string, num: string, name: string, address: string,
                       seats: number, type: string, furniture: string, href: string) {
        this.fullname = fullname;
        this.shortname = shortname;
        this.number = num;
        this.name = name;
        this.address = address;
        this.seats = seats;
        this.type = type;
        this.furniture = furniture;
        this.href = href;
    }
}
