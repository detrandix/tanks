const roundToNDecimalPlaces = (n: number, places: number): number => {
    return Math.round((n + Number.EPSILON) * places) / places
}

export default class NumberService {
    static roundToOneDecimalPlace(n: number): number {
        return roundToNDecimalPlaces(n, 10)
    }

    static roundToTwoDecimalPlaces(n: number): number {
        return roundToNDecimalPlaces(n, 100)
    }

    static roundToNDecimalPlaces(n: number, decimalPlaces: number): number {
        return roundToNDecimalPlaces(n, Math.pow(10, decimalPlaces))
    }
}
