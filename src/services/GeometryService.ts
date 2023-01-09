import Circle from '../model/Circle'
import Line from '../model/Line'
import Point from '../model/Point'
import Polygon from '../model/Polygon'
import NumberService from './NumberService'

const DEG2RAD = Math.PI/180

type translatePointFn = (point: Point) => Point

const translatePolygonPoints = (polygon: Polygon, fn: translatePointFn): Polygon => {
    const translatedPoints = []
    for (let point of polygon.points) {
        translatedPoints.push(fn(point))
    }
    return new Polygon(translatedPoints)
}

export default class GeometryService {
    static deg2rad(deg: number): number {
        return deg * DEG2RAD
    }

    static pointsDistance(p1: Point, p2: Point): number {
        return Math.sqrt(Math.pow(Math.abs(p2.x - p1.x), 2) + Math.pow(Math.abs(p2.y - p1.y), 2))
    }

    static circlesIntersect(circle1: Circle, circle2: Circle): boolean {
        const centersDistance = this.pointsDistance(circle1.center, circle2.center)
        return centersDistance < (circle1.radius + circle2.radius)
    }

    static lineIntersection(line1: Line, line2: Line): Point|null {
        const x1 = line1.p1.x
        const x2 = line1.p2.x
        const x3 = line2.p1.x
        const x4 = line2.p2.x
        const y1 = line1.p1.y
        const y2 = line1.p2.y
        const y3 = line2.p1.y
        const y4 = line2.p2.y
        const denominator = (y4-y3)*(x2-x1)-(x4-x3)*(y2-y1)
        if (denominator === 0) {
            return null
        }
        const u_a = ((x4-x3)*(y1-y3)-(y4-y3)*(x1-x3))/denominator
        const u_b = ((x2-x1)*(y1-y3)-(y2-y1)*(x1-x3))/denominator
        if (u_a >= 0 && u_a <= 1 && u_b >= 0 && u_b <= 1) {
            return {
                x: x1 + u_a * (x2 - x1),
                y: y1 + u_a * (y2 - y1),
            }
        }
        return null
    }

    /**
     * @param angle The angle of rotation in radians.
     */
    static movePoint(point: Point, angle: number, steps: number): Point {
        return {
            x: NumberService.roundToTwoDecimalPlaces(point.x + steps * Math.cos(angle)),
            y: NumberService.roundToTwoDecimalPlaces(point.y + steps * Math.sin(angle)),
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
            x: NumberService.roundToTwoDecimalPlaces(tx * c - ty * s + center.x),
            y: NumberService.roundToTwoDecimalPlaces(tx * s + ty * c + center.y)
        }
    }

    /**
     * @param angle The angle of rotation in radians.
     */
    static rotatePolygonAround(polygon: Polygon, center: Point, angle: number): Polygon {
        return translatePolygonPoints(polygon, (point: Point) => this.rotatePointAround(point, center, angle))
    }

    static pointInsidePolygon(point: Point, polygon: Polygon): boolean {
        // ray-casting algorithm based on
        // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html
        const {x, y} = point

        let inside = false;
        const polygonPoints = polygon.points
        for (let i = 0, j = polygonPoints.length - 1; i < polygonPoints.length; j = i++) {
            const
                xi = polygonPoints[i].x,
                yi = polygonPoints[i].y,
                xj = polygonPoints[j].x,
                yj = polygonPoints[j].y;

            const intersect = ((yi > y) != (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    }

    static polygonInsidePolygon(polygon1: Polygon, polygon2: Polygon): boolean {
        for (let myLine of polygon1.lines) {
            for (let theirLine of polygon2.lines) {
                if (this.lineIntersection(myLine, theirLine) !== null) {
                    return true
                }
            }
        }
        return false
    }
}