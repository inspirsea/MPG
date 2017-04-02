import { Tile, Spell, Vector, Rectangle } from '../model';
import { Enemy } from '../character/enemy';
import { Player } from '../character/player';
import { Swordman } from '../character/swordman';
import { RenderCall, RenderHelper } from '../render';
import { Context } from '../context';
import { ProjectileHandler } from './projectileHandler';
import { AnimationHandler } from './animationHandler';
import { ParticleHandler } from './particleHandler';
import { CollisionDetection } from '../collision/collisionDetection';
import { DeathType } from '../character/deathType';

export class EnemyHandler {

    public enemies: Enemy[] = [];

    private context: Context;
    private renderHelper = RenderHelper.getInstance();
    private projectileHandler: ProjectileHandler;
    private animationHandler: AnimationHandler;
    private particleHandler: ParticleHandler;
    private collisionDetection = CollisionDetection.getInstance();

    constructor(context: Context, projectileHandler: ProjectileHandler, animationHandler: AnimationHandler, particleHandler: ParticleHandler) {
        this.context = context;
        this.projectileHandler = projectileHandler;
        this.animationHandler = animationHandler;
        this.particleHandler = particleHandler;
    }

    public update(delta: number, tiles: Tile[], player: Player) {
        for (let enemy of this.enemies) {
            enemy.update(delta, tiles, player);
            this.enemyCollisionCheck(delta);
            this.checkBurn(enemy);
            this.checkEnemyDeath(enemy);
        }
    }

    createRenderCall(renderCalls: RenderCall[], renderCall: RenderCall, camera: Vector) {
        for (let enemy of this.enemies) {
            if (enemy.inverse) {
                renderCall.vertecies = this.renderHelper.getInverseVertecies(enemy.position.x - camera.x, enemy.position.y - camera.y, enemy.width, enemy.height, renderCall.vertecies);
            } else {
                renderCall.vertecies = this.renderHelper.getVertecies(enemy.position.x - camera.x, enemy.position.y - camera.y, enemy.width, enemy.height, renderCall.vertecies);
            }
            renderCall.textureCoords = this.renderHelper.getTextureCoordinates(renderCall.textureCoords, enemy.currentAnimation.getCurrentFrame());
            renderCall.indecies = this.renderHelper.getIndecies(renderCall.indecies);
            renderCall.color = this.renderHelper.getColor(renderCall.color, enemy.color);
        }

        return renderCalls;
    }

    remove(enemy: Enemy) {
        let index = this.enemies.indexOf(enemy);
        if (index >= 0) {
            this.enemies.splice(index, 1);
        }
    }

    private checkBurn(enemy: Enemy) {
        if (enemy.burnValue > 0) {
            this.particleHandler.createBurn(enemy.position);
        }
    }

    private checkEnemyDeath(enemy: Enemy) {
        if (enemy.dead) {
            if (enemy.deathType == DeathType.freezeDeath) {
                this.projectileHandler.createFrozenSwordManDeath(new Rectangle(enemy.position.x, enemy.position.y, enemy.width, enemy.height), enemy.inverse, enemy.color);
                this.remove(enemy);
            } else if (enemy.deathType == DeathType.fireDeath) {
                this.animationHandler.fireDeathSwordman(new Rectangle(enemy.position.x, enemy.position.y, enemy.width, enemy.height), enemy.inverse);
                this.remove(enemy);
            }
        }
    }

    private enemyCollisionCheck(delta: number) {
        for (let projectile of this.projectileHandler.projectiles) {

            if (projectile instanceof Spell) {

                let removeEnemy: Enemy[] = [];

                for (let enemy of this.enemies) {
                    let velocityDelta = new Vector((projectile.velocity.x * delta) - (enemy.toMove.x), (projectile.velocity.y * delta) - (enemy.toMove.y));
                    let collisionData = this.collisionDetection.checkProjectileCollisionX([new Rectangle(enemy.position.x + (enemy.width / 2) - ((enemy.width * 0.5) / 2), enemy.position.y, enemy.width * 0.5, enemy.height)], projectile, velocityDelta, false);

                    if (collisionData.wallCollision) {

                        enemy.takeDamage(projectile.area.width, projectile.type)
                        if (enemy.inverse) {
                            this.animationHandler.bloodAnimation_B_Right(new Vector(enemy.position.x + 10, enemy.position.y - 20), 75);
                        } else {
                            this.animationHandler.bloodAnimation_B_Left(new Vector(enemy.position.x - 10, enemy.position.y - 20), 75);
                        }

                        this.projectileHandler.destroyProjectile(projectile, this.projectileHandler.projectiles);

                        if (enemy.dead) {
                            this.projectileHandler.createSwordman_death(enemy.position, enemy.inverse, this.projectileHandler.calculateDirection(projectile.area, enemy));
                            removeEnemy.push(enemy);
                        }
                    }
                }

                for (let enemy of removeEnemy) {
                    this.remove(enemy);
                }
            }
        }
    }

}