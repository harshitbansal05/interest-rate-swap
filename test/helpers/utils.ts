import { BN, ether } from "@openzeppelin/test-helpers";

export function price (val: number) {
    return ether(val).toString();
}

export function toBN (num: number | string) {
    return new BN(num);
}

export function trim0x (bigNumber: any) {
    const s = bigNumber.toString();
    if (s.startsWith("0x")) {
        return s.substring(2);
    }
    return s;
}

export function cutSelector (data: string) {
    const hexPrefix = "0x";
    return hexPrefix + data.substr(hexPrefix.length + 8);
}

export function cutLastArg (data: string, padding = 0) {
    return data.substr(0, data.length - 64 - padding);
}
