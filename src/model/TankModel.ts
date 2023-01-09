import { Geom } from 'phaser'
import GeometryService from '../services/GeometryService'
import Utils from '../services/Utils'
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
    playerId: string,
    center: Point,
    width: number,
    height: number,
    radius: number,
    angle: number,
    bodyOrigin: Point,
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
    id: string
    playerId: string
    center: Point
    width: number
    height: number
    radius: number
    polygon: Polygon
    angle: number
    bodyOrigin: Point
    turretYOffset: number
    turretAngle: number
    turretPosition: Point
    turretOrigin: Point
    barrelEndYOffset: number
    barrelEndPosition: Point
    hp: number
    maxHp: number
    destroyed: number|false
    immortalityTtl: number|null
    weapons: Array<Weapon>
    color: TankColorEnum

    constructor(data: TankModelConstructor) {
        this.id = Utils.uuid()
        this.playerId = data.playerId
        this.center = data.center
        this.width = data.width
        this.height = data.height
        this.radius = data.radius
        this.angle = data.angle
        this.bodyOrigin = data.bodyOrigin
        this.turretYOffset = data.turretYOffset
        this.turretAngle = data.turretAngle
        this.turretOrigin = data.turretOrigin
        this.barrelEndYOffset = data.barrelEndYOffset
        this.hp = data.maxHp
        this.maxHp = data.maxHp
        this.destroyed = false
        this.immortalityTtl = data.immortalityTtl
        this.weapons = data.weapons
        this.color = data.color

        // TODO: create polygonGenerator function based on tank type
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
    addRotation(angle: number, tanks: Record<string, TankModel>): void {
        const newPolygon = GeometryService.rotatePolygonAround(this.polygon, this.center, GeometryService.deg2rad(angle))

        const collision = this.collisitionWithOtherTank(this.center, newPolygon, tanks)
        if (collision !== null) {
            return
        }

        this.angle += angle
        this.polygon = newPolygon
        this.turretAngle += angle
        this.turretPosition = computeTurretPosition(this.turretYOffset, this.angle)
        this.barrelEndPosition = computeBarrelEndPosition(this.barrelEndYOffset, this.turretPosition, this.turretAngle)
    }

    move(steps: number, tanks: Record<string, TankModel>): void {
        const angleInRad = GeometryService.deg2rad(this.angle - 90) // TODO: solve this 90degree problem
        const newCenter = GeometryService.movePoint(this.center, angleInRad, steps)
        const newPolygon = GeometryService.movePolygon(this.polygon, angleInRad, steps)

        const collision = this.collisitionWithOtherTank(newCenter, newPolygon, tanks)
        if (collision !== null) {
            return
        }

        this.center = newCenter
        this.polygon = newPolygon
    }

    /**
     * @param angle The angle of rotation in degreees.
     */
    addTurretRotation(angle: number): void {
        this.turretAngle += angle
        this.barrelEndPosition = computeBarrelEndPosition(this.barrelEndYOffset, this.turretPosition, this.turretAngle)
    }

    collisitionWithOtherTank(center: Point, polygon: Polygon, tanks: Record<string, TankModel>): TankModel|null {
        for (let id in tanks) {
            if (id === this.id) {
                continue
            }
            if (! GeometryService.circlesIntersect(
                {center, radius: this.radius},
                {center: tanks[id].center, radius: tanks[id].radius},
            )) {
                continue
            }
            if (GeometryService.polygonInsidePolygon(polygon, tanks[id].polygon)) {
                return tanks[id]
            }
        }
        return null
    }
}
