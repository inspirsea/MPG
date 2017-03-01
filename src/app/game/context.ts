import { Observable, Subscription, Observer } from 'rxjs';
import { ShaderType, Asset } from './model';

export class Context
{
	public shaderProgram: WebGLProgram;
	public particleProgram: WebGLProgram;
	public gl: WebGLRenderingContext;
	public glTexture: WebGLTexture;
	public particleTexture: WebGLTexture;

	constructor(asset: Asset, width: number, height: number, canvas: HTMLCanvasElement){
		this.initContext(width, height, canvas);
		this.initShaders(asset);
	}

	public clear() {
		this.gl.clear( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT );
		this.gl.clearColor(0, 0, 0, 0.95);
	}

	private initContext(width: number, height: number, canvas: HTMLCanvasElement) {
		canvas.width = width;
		canvas.height = height;
		this.gl = canvas.getContext("experimental-webgl");

		console.log("Context initialized...");
	}

	private initShaders(asset: Asset) {
		let vertexShader = this.compileShader(asset.vertexShader, ShaderType.Vertex);
		let fragmentShader = this.compileShader(asset.fragmentShader, ShaderType.Fragment);

		let particleVertexShader = this.compileShader(asset.particleVertexShader, ShaderType.Vertex);
		let particleFragmentShader = this.compileShader(asset.particleFragmentShader, ShaderType.Fragment);

		this.particleProgram = this.gl.createProgram();
		this.gl.attachShader(this.particleProgram, particleVertexShader);
		this.gl.attachShader(this.particleProgram, particleFragmentShader);
		this.gl.linkProgram(this.particleProgram);
		if (!this.gl.getProgramParameter(this.particleProgram, this.gl.LINK_STATUS)) {
			alert("Unable to initialize the shader program: " + this.gl.getProgramInfoLog(this.particleProgram));
		}

		this.shaderProgram = this.gl.createProgram();
		this.gl.attachShader(this.shaderProgram, vertexShader);
		this.gl.attachShader(this.shaderProgram, fragmentShader);
		this.gl.linkProgram(this.shaderProgram);		 
		if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
			alert("Unable to initialize the shader program: " + this.gl.getProgramInfoLog(this.shaderProgram));
		}

		this.initTextures(this.gl, asset.texture, asset.particleTexture);
	}

	private initTextures(gl: WebGLRenderingContext, texture: HTMLImageElement, particleTexture: HTMLImageElement) {

		this.glTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.glTexture);
  		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture);
  		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  		gl.generateMipmap(gl.TEXTURE_2D);

		this.particleTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.particleTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, particleTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.enable(gl.BLEND);
	}

	private compileShader(source: string, shaderType: ShaderType) {
		var shader: WebGLShader;

		if(shaderType == ShaderType.Fragment) {
			shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
		} else if (shaderType == ShaderType.Vertex) {
			shader = this.gl.createShader(this.gl.VERTEX_SHADER);
		}

		this.gl.shaderSource(shader, source);
		this.gl.compileShader(shader);

		if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
     		console.log("An error occurred compiling the shaders: " + this.gl.getShaderInfoLog(shader));
     		return null;
   		}

   		return shader;
	}
}