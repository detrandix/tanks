import GeometryService from '../services/GeometryService'
import Point from './Point'
import Polygon from './Polygon'

const computeTurretPosition = (turretYOffset: number, tankAngle: number): Point => {
    return GeometryService.movePoint({x: 0, y: 0}, GeometryService.deg2rad(tankAngle + 90), turretYOffset)
}

const computeBarrelEndPosition = (barrelEndYOffset: number, turretPosition: Point, turretAngle: number): Point => {
    return GeometryService.movePoint(turretPosition, GeometryService.deg2rad(turretAngle + 90), barrelEndYOffset)
}

export default class TankModel {
    center: Point
    width: number
    height: number
    polygon: Polygon
    angle: number
    turretYOffset: number
    turretAngle: number
    turretPosition: Point
    turretOrigin: Point
    barrelEndYOffset: number
    barrelEndPosition: Point

    constructor(
        center: Point,
        width: number,
        height: number,
        angle: number,
        turretYOffset: number,
        turretAngle: number,
        turretOrigin: Point,
        barrelEndYOffset: number,
    ) {
        this.center = center
        this.width = width
        this.height = height
        this.angle = angle
        this.turretYOffset = turretYOffset
        this.turretAngle = turretAngle
        this.turretOrigin = turretOrigin
        this.barrelEndYOffset = barrelEndYOffset
        this.polygon = new Polygon([
            {x: center.x - width/2, y: center.y - height/2},
            {x: center.x + width/2, y: center.y - height/2},
            {x: center.x + width/2, y: center.y + height/2},
            {x: center.x - width/2, y: center.y + height/2},
        ])
        this.turretPosition = computeTurretPosition(this.turretYOffset, this.angle)
        this.barrelEndPosition = computeBarrelEndPosition(this.barrelEndYOffset, this.turretPosition, this.turretAngle)
    }

    /**
     * @param angle The angle of rotation in degreees.
     */
    addRotation(angle: number) {
        this.angle += angle
        this.polygon = GeometryService.rotatePolygonAround(this.polygon, this.center, GeometryService.deg2rad(angle))
        this.turretAngle += angle
        this.turretPosition = computeTurretPosition(this.turretYOffset, this.angle)
        this.barrelEndPosition = computeBarrelEndPosition(this.barrelEndYOffset, this.turretPosition, this.turretAngle)
    }

    move(steps: number) {
        const angleInRad = GeometryService.deg2rad(this.angle - 90) // TODO: solve this 90degree problem
        this.center = GeometryService.movePoint(this.center, angleInRad, steps)
        this.polygon = GeometryService.movePolygon(this.polygon, angleInRad, steps)
    }

    /**
     * @param angle The angle of rotation in degreees.
     */
    addTurretRotation(angle: number) {
        this.turretAngle += angle
        this.barrelEndPosition = computeBarrelEndPosition(this.barrelEndYOffset, this.turretPosition, this.turretAngle)
    }
}
