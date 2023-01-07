import Point from './Point'

export default class Polygon {
    points: Array<Point>

    constructor(points: Array<Point>) {
        this.setPoints(points)
    }

    setPoints(points: Array<Point>) {
        if (points.length < 2) {
            throw "There must be at least 3 points for polygon"
        }

        this.points = points
    }
}
