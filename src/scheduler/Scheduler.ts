import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
import {Room} from "../model/Room";

export const allowedTime: any = ["MWF 0800-0900", "MWF 0900-1000", "MWF 1000-1100", "MWF 1100-1200", "MWF 1200-1300",
    "MWF 1300-1400", "MWF 1400-1500", "MWF 1500-1600", "MWF 1600-1700", "TR  0800-0930", "TR  0930-1100",
    "TR  1100-1230", "TR  1230-1400", "TR  1400-1530", "TR  1530-1700"];

export default class Scheduler implements IScheduler {

    private calculateDistance([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]) {
        const R = 6371e3; // metres
        const phi1 = lat1 * Math.PI / 180;
        const phi2 = lat2 * Math.PI / 180;
        const deltaPhi = (lat2 - lat1) * Math.PI / 180;
        const deltaLambda = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private sortSectionsDec(sections: SchedSection[]) {
        return sections.sort((s1, s2) => {
            const s1Size = s1.courses_pass + s1.courses_fail + s1.courses_audit;
            const s2Size = s2.courses_pass + s2.courses_fail + s2.courses_audit;
            if (s1Size > s2Size) {
                return -1;
            } else if (s1Size < s2Size) {
                return 1;
            }
            return 0;
        });
    }

    private sortRoomsDec(rooms: SchedRoom[]) {
        return rooms.sort((r1, r2) => {
            if (r1.rooms_seats > r2.rooms_seats) {
                return -1;
            } else if (r1.rooms_seats < r2.rooms_seats) {
                return 1;
            }
            return 0;
        });
    }

    private hasEnoughSeats(section: SchedSection, room: SchedRoom): boolean {
        return section.courses_pass + section.courses_fail + section.courses_audit <= room.rooms_seats;
    }

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        const result: Array<[SchedRoom, SchedSection, TimeSlot]> = [];
        const sortedSections: SchedSection[] = this.sortSectionsDec(sections);
        const sortedRooms: SchedRoom[] = this.sortRoomsDec(rooms);
        let roomTimeMap: any = {};
        let sectionTimeMap: any = {};
        let roomTimeKey: any = [];
        let sectionTimeKey: any = [];
        let i = 0, j = 0, t = 0;
        while (i !== sortedSections.length && j !== sortedRooms.length) {
            roomTimeKey = [];
            sectionTimeKey = [];
            const section = sortedSections[i];
            const room = sortedRooms[j];
            if (this.hasEnoughSeats(section, room)) {
                if (t === allowedTime.length) { // restart allowedTime array from the beginning
                    t = 0;
                }
                const time = allowedTime[t];
                roomTimeKey.push(room.rooms_shortname + "_" + room.rooms_number);
                roomTimeKey.push(time);
                sectionTimeKey.push(section.courses_dept + "_" + section.courses_id);
                sectionTimeKey.push(time);
                if (!sectionTimeMap[sectionTimeKey]) {
                    if (!roomTimeMap[roomTimeKey]) { // if room is not scheduled at current time, then schedule it
                        roomTimeMap[roomTimeKey] = 1;
                        sectionTimeMap[sectionTimeKey] = 1;
                        let sch: [SchedRoom, SchedSection, TimeSlot] = [room, section, time];
                        result.push(sch);
                        i++;
                    } else if (roomTimeMap[roomTimeKey] === 1) { // if room is booked at curr time, try another time
                        t++;
                    }
                } else {
                    t++;
                }
                if (t === allowedTime.length - 1) { // if all the time for current room is full, look for another room
                    j++;
                    t = 0;
                }
            } else {
                i++;
            }
        }
        return result;
    }
}
