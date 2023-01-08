import GeometryService from '../services/GeometryService'
import Point from './Point'
import Polygon from './Polygon'
import { TankColorEnum } from './TankColorEnum'
import Weapon from './Weapon'

const computeTurretPosition = (turretYOffset: number, tankAngle: number): Point => {
    return GeometryService.movePoint({x: 0, y: 0}, GeometryService.deg2rad(tankAngle + 90), turretYOffset)
}

const computeBarrelEndPosition = (barrelEndYOffset: number, turretPosition: Point, turretAngle: number): Point => {
    return GeometryService.movePoint(turretPosition, GeometryService.deg2rad(turretAngle + 90), barrelEndYOffset)
}

export type TankModelConstructor = {
    center: Point,
    width: number,
    height: number,
    angle: number,
    turretYOffset: number,
    turretAngle: number,
    turretOrigin: Point,
    barrelEndYOffset: number,
    maxHp: number,
    immortalityTtl: number|null,
    weapons: Array<Weapon>,
    color: TankColorEnum,
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
    hp: number
    maxHp: number
    immortalityTtl: number|null
    weapons: Array<Weapon>
    color: TankColorEnum

    constructor(data: TankModelConstructor) {
        this.center = data.center
        this.width = data.width
        this.height = data.height
        this.angle = data.angle
        this.turretYOffset = data.turretYOffset
        this.turretAngle = data.turretAngle
        this.turretOrigin = data.turretOrigin
        this.barrelEndYOffset = data.barrelEndYOffset
        this.hp = data.maxHp
        this.maxHp = data.maxHp
        this.immortalityTtl = data.immortalityTtl
        this.weapons = data.weapons
        this.color = data.color

        this.polygon = new Polygon([
            {x: data.center.x - data.width/2, y: data.center.y - data.height/2},
            {x: data.center.x + data.width/2, y: data.center.y - data.height/2},
            {x: data.center.x + data.width/2, y: data.center.y + data.height/2},
            {x: data.center.x - data.width/2, y: data.center.y + data.height/2},
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
