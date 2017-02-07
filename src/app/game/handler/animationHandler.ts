import { Vector, Sprite, Rectangle, Animation, SpellType } from '../model'
import { TextureMapper } from '../render/textureMapper';
import { RenderCall } from '../render/renderCall';
import { RenderHelper } from '../render/renderHelper';
import { Context } from '../context';
import { CollisionData } from '../collision/collisionData';
import { Player } from '../character/player';

export class AnimationHandler {

    public animations: Animation[] = [];
    private textureMapper = TextureMapper.getInstance();
    private renderHelper = RenderHelper.getInstance();
    private context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    public bloodAnimation_A(position: Vector, size: number) {
        let animation = new Animation();
        animation.textureNumber.push(100);
        animation.textureNumber.push(101);
        animation.textureNumber.push(102);
        animation.textureNumber.push(103);
        animation.textureNumber.push(104);
        animation.textureNumber.push(105);
        animation.areaToRender = new Rectangle(position.x, position.y, size, size);

        animation.repetitions = 6;

        this.animations.push(animation);

        return animation;
    }

    public bloodAnimation_B_Right(position: Vector, size: number) {
        let animation = new Animation();
        animation.textureNumber.push(106);
        animation.textureNumber.push(107);
        animation.textureNumber.push(108);
        animation.textureNumber.push(109);
        animation.textureNumber.push(110);
        animation.textureNumber.push(111);
        animation.areaToRender = new Rectangle(position.x, position.y, size, size);

        animation.repetitions = 6;

        this.animations.push(animation);

        return animation;
    }

    public bloodAnimation_B_Left(position: Vector, size: number) {
        let animation = new Animation();
        animation.textureNumber.push(106);
        animation.textureNumber.push(107);
        animation.textureNumber.push(108);
        animation.textureNumber.push(109);
        animation.textureNumber.push(110);
        animation.textureNumber.push(111);
        animation.areaToRender = new Rectangle(position.x, position.y, size, size);

        animation.inverse = true;

        animation.repetitions = 6;

        this.animations.push(animation);

        return animation;
    }

    public bloodAnimation_C(position: Vector, size: number) {
        let animation = new Animation();
        animation.textureNumber.push(147);
        animation.textureNumber.push(148);
        animation.textureNumber.push(149);
        animation.textureNumber.push(150);
        animation.textureNumber.push(151);
        animation.textureNumber.push(152);
        animation.areaToRender = new Rectangle(position.x, position.y, size, size);

        animation.repetitions = 6;

        this.animations.push(animation);

        return animation;
    }

    public swordman_death(position: Vector, inverse: boolean) {
        let animation = new Animation();
        animation.textureNumber.push(214);
        animation.textureNumber.push(216);
        animation.textureNumber.push(217);
        animation.textureNumber.push(218);

        animation.timeToChange = 120;

        animation.repetitions = 4;

        animation.areaToRender = new Rectangle(position.x, position.y, 56, 59);

        animation.inverse = inverse;

        this.animations.push(animation);

        return animation;
    }

    public swordman_corpse(position: Vector, inverse: boolean) {
        let animation = new Animation();
        animation.textureNumber.push(219);

        animation.timeToChange = 120;

        animation.delay = 4;

        animation.areaToRender = new Rectangle(position.x, position.y, 56, 59);

        animation.inverse = inverse;

        this.animations.push(animation);

        return animation;
    }

    public swordman_head(position: Vector, inverse: boolean) {
        let animation = new Animation();
        animation.textureNumber.push(215);
        animation.textureNumber.push(220);
        animation.textureNumber.push(221);
        animation.textureNumber.push(222);
        animation.textureNumber.push(223);
        animation.textureNumber.push(224);
        animation.textureNumber.push(225);
        animation.textureNumber.push(226);

        animation.timeToChange = 75;
        animation.areaToRender = new Rectangle(position.x, position.y, 56, 59);

        animation.inverse = inverse;

        this.animations.push(animation);

        return animation;
    }

    public createSpellAnimation(position: Vector, animationSize: number, inverse: boolean, type: SpellType) {
        switch (type) {
            case SpellType.fireball: return this.fireball(position, animationSize, inverse);
            case SpellType.electricbolt: return this.electricbolt(position, animationSize, inverse);
        }
    }

    public sizzle(position: Vector, size: number) {
        let animation = new Animation();
        animation.textureNumber.push(137);
        animation.textureNumber.push(138);
        animation.textureNumber.push(139);
        animation.textureNumber.push(140);
        animation.textureNumber.push(141);
        animation.textureNumber.push(142);
        animation.textureNumber.push(143);
        animation.textureNumber.push(144);
        animation.textureNumber.push(145);
        animation.textureNumber.push(146);
        animation.timeToChange = 50;
        animation.areaToRender = new Rectangle(position.x, position.y, size, size);

        animation.repetitions = 10;

        this.animations.push(animation);

        return animation;
    }

    public fireball_destroy(position: Vector, size: number) {
        let animation = new Animation();
        animation.textureNumber.push(118);
        animation.textureNumber.push(119);
        animation.textureNumber.push(120);
        animation.textureNumber.push(121);
        animation.textureNumber.push(122);
        animation.textureNumber.push(123);
        animation.textureNumber.push(124);
        animation.textureNumber.push(125);
        animation.textureNumber.push(126);
        animation.timeToChange = 50;
        animation.areaToRender = new Rectangle(position.x, position.y, size, size);

        animation.repetitions = 9;

        this.animations.push(animation);

        return animation;
    }

    public fallDeath(position: Vector) {
        this.bloodAnimation_A(new Vector(position.x, position.y), 50);
        this.bloodAnimation_B_Right(new Vector(position.x + 5, position.y - 15), 100);
        this.bloodAnimation_B_Left(new Vector(position.x - 55, position.y - 15), 100);
    }

    public update(delta: number) {

        let completedAnimations: Animation[] = [];

        for (let animation of this.animations) {
            animation.next(delta);
            if (animation.repetitions <= 0) {
                completedAnimations.push(animation);
            }
        }

        for (let completedAnimation of completedAnimations) {
            let index = this.animations.indexOf(completedAnimation);

            if (index != -1) {
                this.animations.splice(index, 1);
            }
        }
    }

    public createRenderCall() {
        let renderCall = new RenderCall();

        var vertecies: number[] = [];
        var textureCoords: number[] = [];
        var indecies: number[] = [];

        for (let animation of this.animations) {
            if (animation.delay <= 0) {
                if (animation.inverse) {
                    vertecies = this.renderHelper.getInverseVertecies(animation.areaToRender.x, animation.areaToRender.y, animation.areaToRender.width, animation.areaToRender.height, vertecies);
                } else {
                    vertecies = this.renderHelper.getVertecies(animation.areaToRender.x, animation.areaToRender.y, animation.areaToRender.width, animation.areaToRender.height, vertecies);
                }
                textureCoords = this.renderHelper.getTextureCoordinates(textureCoords, animation.getCurrentFrame());
                indecies = this.renderHelper.getIndecies(indecies);
            }
        }

        renderCall.vertecies = vertecies;
        renderCall.textureCoords = textureCoords;
        renderCall.indecies = indecies;
        renderCall.context = this.context;

        return renderCall;
    }

    public remove(animation: Animation) {
        let index = this.animations.indexOf(animation);
        if (index != -1) {
            this.animations.splice(index, 1);
        }
    }

    public enemy(position: Vector, inverse: boolean) {
        let animation = new Animation();
        animation.textureNumber.push(209);
        animation.textureNumber.push(211);
        animation.textureNumber.push(210);

        animation.timeToChange = 120;
        animation.areaToRender = new Rectangle(position.x, position.y, 56, 58);

        animation.inverse = inverse;

        this.animations.push(animation);

        return animation;
    }

    private fireball(position: Vector, size: number, inverse: boolean) {
        let animation = new Animation();
        animation.textureNumber.push(112);
        animation.textureNumber.push(113);
        animation.textureNumber.push(114);
        animation.textureNumber.push(115);
        animation.textureNumber.push(116);
        animation.textureNumber.push(117);
        animation.timeToChange = 50;
        animation.areaToRender = new Rectangle(position.x, position.y, size, size);

        animation.inverse = inverse;

        this.animations.push(animation);

        return animation;
    }

    private electricbolt(position: Vector, size: number, inverse: boolean) {
        let animation = new Animation();
        animation.textureNumber.push(127);
        animation.textureNumber.push(128);
        animation.textureNumber.push(129);
        animation.textureNumber.push(130);
        animation.textureNumber.push(131);
        animation.textureNumber.push(132);
        animation.textureNumber.push(133);
        animation.textureNumber.push(134);
        animation.textureNumber.push(135);
        animation.textureNumber.push(136);
        animation.timeToChange = 50;
        animation.areaToRender = new Rectangle(position.x, position.y, size, size);

        animation.inverse = inverse;

        this.animations.push(animation);

        return animation;
    }



}