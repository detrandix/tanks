import Line from './Line'
import Point from './Point'

const generateLinesFromPoints = (points: Array<Point>): Array<Line> => {
    const lines = []
    const newPoints = [...points, points[0]]
    for (let i = 0; i < newPoints.length - 1; i++) {
        lines.push({ p1: newPoints[i], p2: newPoints[i + 1] })
    }
    return lines
}

export default class Polygon {
    points: Array<Point>
    lines: Array<Line>

    constructor(points: Array<Point>) {
        if (points.length < 2) {
            throw 'There must be at least 3 points for polygon'
        }

        this.points = points
        this.lines = generateLinesFromPoints(points)
    }
}
