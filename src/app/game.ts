import { Context, TileMap, Render } from './';
import { RenderCall } from './render/renderCall';
import { Editor } from './editor/editor';
import { Player } from './player/player';
import { Vector, Rectangle } from '../model';
import { CollisionDetection } from './collision/collisionDetection';
import { Gravity } from './forces/gravity';
import { TextRenderer } from './text/textRenderer';

export class Game
{
	private fps = 60;
	private context: Context = new Context();
	private tileMap: TileMap = new TileMap();
	private render: Render;
	private renderCalls: RenderCall[] = [];
	private editor: Editor = new Editor();
	private collision: CollisionDetection = CollisionDetection.getInstance();
	private player: Player;
	private leftKeyPress: boolean;
	private rightKeyPress: boolean;
	private jumpKeyPress: boolean;
	private tileSizeX: number = 25;
	private tileSizeY: number = 25;
	private started: boolean = false;
	private lastUpdate: number;
	private textRenderer: TextRenderer;
	private intevalTimer: any;
	private gameArea = new Rectangle(-50, -50, 1300, 900);

	constructor() {
		var doneLoading = this.context.doneListener();
		var tileEdited = this.editor.tileEdited().subscribe(() => {});

		doneLoading.subscribe(() => {
			this.render = new Render();
			this.start();
		});


		this.context.init(1200, 800, false);
		this.editor.init(this.tileSizeX, this.tileSizeY, this.context.canvas, this.collision);
		this.tileMap.create(this.context, this.editor.tiles);
		this.player = new Player(new Vector(200, 600), this.context, 45, 45);
		this.textRenderer = new TextRenderer(this.context);
	}

	private start() {
		this.initKeyBindings();
		this.intevalTimer = setInterval(this.run(), 0);
	}

	private run() {
		let loops = 0, skipTicks = 1000 / this.fps,
      	maxFrameSkip = 10,
      	nextGameTick = (new Date).getTime();

  		return () => {
	    	loops = 0;
	    	
	    	while ((new Date).getTime() > nextGameTick && loops < maxFrameSkip) {
	    		let delta = nextGameTick - this.lastUpdate;
				this.lastUpdate = nextGameTick;
	      		this.renderCalls = [];

	      		if(!this.started) {
	      			if(this.editor.doneLoading) {
		      			this.renderCalls.push(this.editor.createRenderCall());
		      		}
	      		} else {
	      			this.collision.checkDeath(this.player, this.gameArea);
	      			let collisionData = this.collision.collisionDetection(this.tileMap.tiles, this.player);
	      			this.checkKeys(delta);
	      			this.player.update(collisionData, delta);
	      		}

	      		nextGameTick += skipTicks;
	      		loops++;
	    	}
	    
	    	if(loops) {
	    		this.context.clear();

	    		//EDITOR
	    		this.renderCalls.push(this.tileMap.createRenderCall([this.editor.currentTile]));
	    		this.renderCalls.push(this.editor.preview.createRenderCall());

	    		//Game
	    		if(this.player.dead) {
	    			this.renderCalls.push(this.textRenderer.createTextRenderCall(400, 64, 50));
	    			clearInterval(this.intevalTimer);
	    		}
	    		
	    		this.renderCalls.push(this.tileMap.createRenderCall(this.editor.tiles));
				this.renderCalls.push(this.player.createRenderCall());
				this.render.render(this.renderCalls);
	    	} 
  		};
	}

	private checkKeys(delta: number) {
		if(this.leftKeyPress) {
			this.player.moveLeft(delta);
		}

		if(this.rightKeyPress) {
			this.player.moveRight(delta);
		}

		if(this.jumpKeyPress) {
			this.player.jump();
		}
	}

	private initKeyBindings() {

		document.body.addEventListener("keypress", (event: KeyboardEvent) => {

		    var keyCode = event.keyCode;

		    switch (keyCode) {
		    	case 97:
		    		this.leftKeyPress = true;
		    		break;
		    	case 100:
		    		this.rightKeyPress = true;
		    		break;
		    	case 119: 
		    		this.jumpKeyPress = true;
		    }

		});

		document.body.addEventListener("keyup", (event: KeyboardEvent) => {

		    var keyCode = event.keyCode;

		    switch (keyCode) {
		    	case 65:
		    		this.leftKeyPress = false;
		    		break;
		    	case 68:
		    		this.rightKeyPress = false;
		    		break;
		    	case 87:
		    		this.jumpKeyPress = false;
		    		break;
		    }

		});

		document.getElementById("start").addEventListener("click", (event: MouseEvent) => {
			this.started = true;
		});

	}
}