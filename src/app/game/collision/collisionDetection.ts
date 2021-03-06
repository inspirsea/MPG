import { Vector, Tile, Rectangle, Projectile, DynamicTile } from '../model';
import { CollisionData, Grid } from './';
import { Character } from '../character/character';
import { Enemy } from '../character/enemy';

export class CollisionDetection {

	private static instance: CollisionDetection = new CollisionDetection();
	private grid: Grid;
	private gameSize: Vector;
	private gridItemSize: number;


	constructor() {
		if (CollisionDetection.instance) {
			throw new Error("Static class cant be instanced!");
		}

		CollisionDetection.instance = this;
	}

	public static getInstance() {
		return CollisionDetection.instance;
	}

	public createGrid(gameSize: Vector, collidables: Rectangle[]) {
		this.gameSize = gameSize;
		this.grid = new Grid(25, this.gameSize);

		for (let collidable of collidables) {
			this.grid.insert(collidable);
		}
	}

	public collisionDetection(tiles: Tile[], dynamicTiles: DynamicTile[], character: Character, frameVelocity: Vector, delta: number) {

		let collisionData = this.checkCollision(tiles, dynamicTiles, character, frameVelocity, delta);

		return collisionData;
	}

	public fastCheckEnviroment(rect: Rectangle, tiles: Tile[]) {
		let clear = true;

		let possibleColls = this.grid.get(rect);

		for (let tile of possibleColls) {
			if (this.aabbCheck(rect, tile)) {
				clear = false;
			}
		}

		return clear;
	}

	public checkProjectileCollisionX(collidables: Rectangle[], projectile: Projectile, frameVelocity: Vector, staticCollisions: boolean, checkClose: boolean) {

		let broadphasebox = this.getSweptBroadphaseBoxX(projectile.collisionArea, frameVelocity);

		let possibleColls: Rectangle[];

		if (staticCollisions) {
			possibleColls = this.grid.get(broadphasebox);
		} else {
			possibleColls = collidables;
		}

		let collisionData: CollisionData = new CollisionData();

		for (let collidable of possibleColls) {
			if (this.aabbCheck(broadphasebox, collidable)) {
				collisionData = this.aabbCollisionX(projectile.collisionArea, collidable, frameVelocity, collisionData);
			}
		}

		if (checkClose) {
			for (let collidable of possibleColls) {
				if (this.aabbCheck(projectile.collisionArea, collidable)) {
					collisionData.wallCollision = true;
				}
			}
		}

		return collisionData;
	}

	public checkProjectileCollisionY(collidables: Rectangle[], projectile: Projectile, frameVelocity: Vector, staticCollisions: boolean) {
		let broadphasebox = this.getSweptBroadphaseBoxY(projectile.collisionArea, frameVelocity);

		let possibleColls: Rectangle[];

		if (staticCollisions) {
			possibleColls = this.grid.get(broadphasebox);
		} else {
			possibleColls = collidables;
		}

		let collisionData: CollisionData = new CollisionData();

		for (let collidable of possibleColls) {
			if (this.aabbCheck(broadphasebox, collidable)) {
				collisionData = this.aabbCollisionY(projectile.collisionArea, collidable, frameVelocity, collisionData);
			}
		}

		return collisionData;
	}

	public checkCollision(tiles: Tile[], dynamicTiles: DynamicTile[], character: Character, frameVelocity: Vector, delta: number) {

		let tilesToCheck = tiles;
		let collisionData: CollisionData = new CollisionData();
		let dynamicCollisionData = new CollisionData();
		let rect1 = character.getCollisionArea();
		let broadphasebox = this.getSweptBroadphaseBoxY(rect1, frameVelocity);

		let possibleColls = this.grid.get(broadphasebox) as Tile[];

		for (let dynamicTile of dynamicTiles) {
			let deltaVelocity = new Vector(frameVelocity.x - dynamicTile.velocity.x * delta, frameVelocity.y - dynamicTile.velocity.y * delta);
			dynamicCollisionData = this.checkDynamicTileY(dynamicTile, rect1, character, deltaVelocity, dynamicCollisionData, delta);
		}

		for (let tile of possibleColls) {
			if (this.aabbCheck(broadphasebox, tile)) {
				collisionData = this.aabbCollisionY(rect1, tile, frameVelocity, collisionData);
			}
		}

		if (dynamicCollisionData.groundCollision) {
			collisionData = dynamicCollisionData;
			frameVelocity.y = dynamicCollisionData.velocityY;
		}

		character.position.y += frameVelocity.y * collisionData.collisionTimeY;

		rect1 = character.getCollisionArea();
		broadphasebox = this.getSweptBroadphaseBoxX(rect1, frameVelocity);

		for (let dynamicTile of dynamicTiles) {
			let deltaVelocity = new Vector(frameVelocity.x - dynamicTile.velocity.x * delta, frameVelocity.y - dynamicTile.velocity.y * delta);
			dynamicCollisionData = this.checkDynamicTileX(dynamicTile, rect1, character, deltaVelocity, dynamicCollisionData, delta);
		}

		for (let tile of tilesToCheck) {
			if (this.aabbCheck(broadphasebox, tile)) {
				collisionData = this.aabbCollisionX(character.getCollisionArea(), tile, frameVelocity, collisionData);
			}
		}

		if (dynamicCollisionData.wallCollision) {
			collisionData.wallCollision = dynamicCollisionData.wallCollision;
			collisionData.collisionTimeX = dynamicCollisionData.collisionTimeX;
			frameVelocity.x = dynamicCollisionData.velocityX;
		}

		character.position.x += frameVelocity.x * collisionData.collisionTimeX;

		collisionData.remainingTime = 1 - collisionData.collisionTimeY;

		return collisionData;
	}

	public getClosestX(rect: Rectangle, tiles: Rectangle[], inverse: boolean) {
		let closestX: number = inverse ? 0 : this.gameSize.x;

		let possibleColls = this.grid.get(rect);

		for (let tile of possibleColls) {
			if (this.aabbCheck(rect, tile)) {
				if (inverse) {
					let tileVal = tile.x + tile.width;
					if (tileVal > closestX) {
						closestX = tileVal;
					}
				} else {
					let tileVal = tile.x;
					if (tileVal < closestX) {
						closestX = tileVal;
					}
				}
			}
		}

		return closestX;
	}

	public checkCoutOfBounds(character: Character, area: [number, number]) {
		let rect = new Rectangle(0, 0, area[0], area[1]);
		if (!this.aabbCheck(character.getCollisionArea(), rect)) {
			character.dead = true;
		}
	}

	public aabbCheck(rect1: Rectangle, rect2: Rectangle) {
		return (rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.height + rect1.y > rect2.y)
	}

	public aabbCheckS(rect1: Rectangle, areas: Rectangle[]) {
		for (let rect2 of areas) {
			if ((rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.height + rect1.y > rect2.y)) {
				return true;
			}
		}

		return false;
	}

	private checkDynamicTileY(dynamicTile: DynamicTile, characterCollisionArea: Rectangle, character: Character, frameVelocity: Vector, dynamicCollisionData: CollisionData, delta: number) {

		let broadphasebox = this.getSweptBroadphaseBoxY(characterCollisionArea, frameVelocity);

		if (this.aabbCheck(broadphasebox, dynamicTile.tile)) {
			dynamicCollisionData = this.aabbCollisionY(characterCollisionArea, dynamicTile.tile, frameVelocity, dynamicCollisionData);
			if (dynamicCollisionData.groundCollision) {
				dynamicCollisionData.lift = dynamicTile;
			}
		}

		return dynamicCollisionData;
	}

	private checkDynamicTileX(dynamicTile: DynamicTile, characterCollisionArea: Rectangle, character: Character, frameVelocity: Vector, dynamicCollisionData: CollisionData, delta: number) {

		let broadphasebox = this.getSweptBroadphaseBoxX(characterCollisionArea, frameVelocity);

		if (this.aabbCheck(broadphasebox, dynamicTile.tile)) {
			dynamicCollisionData = this.aabbCollisionX(characterCollisionArea, dynamicTile.tile, frameVelocity, dynamicCollisionData);
		}

		return dynamicCollisionData;
	}

	private getSweptBroadphaseBoxX(rect: Rectangle, velocity: Vector) {
		let x = rect.x + velocity.x;
		let y = rect.y;
		let width = rect.width + Math.abs(velocity.x);
		let height = rect.height;

		return new Rectangle(x, y, width, height);
	}

	private getSweptBroadphaseBoxY(rect: Rectangle, velocity: Vector) {
		let x = rect.x;
		let y = rect.y + velocity.y;
		let width = rect.width;
		let height = rect.height + Math.abs(velocity.y);

		return new Rectangle(x, y, width, height);
	}

	private aabbCollisionY(rect1: Rectangle, rect2: Rectangle, velocity: Vector, collisionData: CollisionData) {
		let yInvEntry: number;
		let yInvExit: number;

		if (velocity.y > 0) {
			yInvEntry = (rect2.y) - (rect1.y + rect1.height);
			yInvExit = (rect2.y + rect2.height) - (rect1.y);
		} else {
			yInvEntry = (rect2.y + rect2.height) - (rect1.y);
			yInvExit = (rect2.y) - (rect1.y + rect1.height);
		}

		let yEntry: number;
		let yExit: number;

		if (velocity.y == 0) {
			yEntry = -Number.MAX_SAFE_INTEGER;
			yExit = Number.MAX_SAFE_INTEGER;
		} else {
			yEntry = yInvEntry / velocity.y;
			yExit = yInvExit / velocity.y;
		}

		let entryTime = yEntry;
		let exitTime = yExit;

		if (entryTime > exitTime || yEntry < 0 || yEntry > 1) {
			return collisionData;
		} else {
			if (velocity.y < 0) {
				collisionData.normalY = 1;
			}
			else {
				collisionData.normalY = -1;
			}

			if (collisionData.collisionTimeY > entryTime) {
				collisionData.collisionTimeY = entryTime;
				collisionData.velocityY = velocity.y;
			}

			if (velocity.y > 28) {
				collisionData.fallDeath = true;
			}

			collisionData.groundCollision = true;

		}
		return collisionData;
	}

	private aabbCollisionX(rect1: Rectangle, rect2: Rectangle, velocity: Vector, collisionData: CollisionData) {
		let xInvEntry: number;
		let xInvExit: number;

		if (velocity.x > 0) {
			xInvEntry = (rect2.x) - (rect1.x + rect1.width);
			xInvExit = (rect2.x + rect2.width) - (rect1.x);
		} else {
			xInvEntry = (rect2.x + rect2.width) - (rect1.x);
			xInvExit = (rect2.x) - (rect1.x + rect1.width);
		}

		let xEntry: number;
		let xExit: number;

		if (velocity.x == 0) {
			xEntry = -Number.MAX_SAFE_INTEGER;
			xExit = Number.MAX_SAFE_INTEGER;
		} else {
			xEntry = xInvEntry / velocity.x;
			xExit = xInvExit / velocity.x;
		}

		let entryTime = xEntry;
		let exitTime = xExit;

		if (entryTime > exitTime || xEntry < 0 || xEntry > 1) {
			return collisionData;
		} else {
			if (xInvEntry < 0) {
				collisionData.normalX = 1;
			} else {
				collisionData.normalX = -1;
			}

			if (collisionData.collisionTimeX > entryTime) {
				collisionData.collisionTimeX = entryTime;
				collisionData.velocityX = velocity.x;
			}

			collisionData.wallCollision = true;
		}

		return collisionData;
	}
}