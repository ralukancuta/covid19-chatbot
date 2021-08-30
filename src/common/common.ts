export class Common {
    // generate a random integer between min and max
    static randomInteger(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // check if a specific value is unique in array
    static onlyUnique(value: string | undefined, index: number, array: any) {
        if (!value) {
            return false;
        }
        return array.indexOf(value) === index;
    }

    // get array index for a selected ordinal. e.g. first = 0, lastone = length-1
    static getIndexFromSelectedOrdinal(ordinal: any, array: any): number {
        let index: number;

        if (ordinal.toString() === "lastone") {
            index = array.length - 1;
        }
        else {
            index = +ordinal - 1;
        }

        //out of range, return -1
        if (index < 0 || index >= array.length) {
            return - 1;
        }

        return index;
    }
}