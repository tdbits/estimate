import { convertMinutes, convertToDuration, convertToMinutes } from "./utils";

describe("Utils", () => {
    describe("convertToMinutes", () => {
        it("Converts a duration correctly to minutes value.", () => {
            expect(convertToMinutes({ weeks: 1, days: 1, hours: 1, minutes: 10 })).toBe(2410);
        });
    });
    describe("convertToDuration", () => {
        it("Converts 1w2d1h10m to the correct duration.", () => {
            expect(convertToDuration("1w2d1h10m")).toBe({ weeks: 1, days: 2, hours: 1, minutes: 10 });
        });
    });
    describe("convertMinutes", () => {
        it("Converts 2400 minutes to correct duration.", () => {
            expect(convertMinutes(2400)).toBe({ week: 1, days: 1, hours: 1, minutes: 10 });
        });
    });
    describe("durationToString", () => {
    });
});