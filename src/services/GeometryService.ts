import Point from '../model/Point'
import Polygon from '../model/Polygon'

const DEG2RAD = Math.PI/180

type translatePointFn = (point: Point) => Point

const translatePolygonPoints = (polygon: Polygon, fn: translatePointFn): Polygon => {
    const translatedPoints = []
    for (let point of polygon.points) {
        translatedPoints.push(fn(point))
    }
    return new Polygon(translatedPoints)
}

const roundToTwoDecimalPlaces = (n: number): number => {
    return Math.round((n + Number.EPSILON) * 100) / 100
}

export default class GeometryService {
    static deg2rad(deg: number): number {
        return deg * DEG2RAD
    }

    /**
     * @param angle The angle of rotation in radians.
     */
    static movePoint(point: Point, angle: number, steps: number): Point {
        return {
            x: roundToTwoDecimalPlaces(point.x + steps * Math.cos(angle)),
            y: roundToTwoDecimalPlaces(point.y + steps * Math.sin(angle)),
        }
    }

    /**
     * @param angle The angle of rotation in radians.
     */
    static movePolygon(polygon: Polygon, angle: number, steps: number): Polygon {
        return translatePolygonPoints(polygon, (point: Point) => this.movePoint(point, angle, steps))
    }

    /**
     * @param angle The angle of rotation in radians.
     */
    static rotatePointAround(point: Point, center: Point, angle: number): Point {
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        const tx = point.x - center.x;
        const ty = point.y - center.y;

        return {
            x: roundToTwoDecimalPlaces(tx * c - ty * s + center.x),
            y: roundToTwoDecimalPlaces(tx * s + ty * c + center.y)
        }
    }

    /**
     * @param angle The angle of rotation in radians.
     */
    static rotatePolygonAround(polygon: Polygon, center: Point, angle: number): Polygon {
        return translatePolygonPoints(polygon, (point: Point) => this.rotatePointAround(point, center, angle))
    }
}