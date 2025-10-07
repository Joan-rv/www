const vsSource = `
  attribute vec2 aPosition;
  varying vec2 vPosition;
  void main(void) {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vPosition = aPosition;
  }
`;

const fsSource = `
  precision highp float;

  #define complex vec2

  varying vec2 vPosition;
  uniform vec2 uOffset;
  uniform float uZoom;

  vec3 gradient(vec3 start, vec3 end, float point) {
      return start * (1.0 - point) + end * point;
  }

  complex cx_sqr(complex v) {
      return complex(
          v.x * v.x - v.y * v.y,
          2.0 * v.x * v.y
      );
  }

  vec3 mandelbrot(complex c) {
      const int max_iters = 200;
      complex z = vec2(0.0);
      for (int i = 0; i < max_iters; i++) {
          if (dot(z, z) > 2.0 * 2.0) {
              vec3 start = vec3(0.2666666, 0.00392156, 0.32941176);
              vec3 end = vec3(0.992156, 0.90588235, 0.14509803);
              return gradient(start, end, float(i) / float(max_iters));
          }
          z = cx_sqr(z) + c;
      }
      return vec3(0.0);
  }

  void main() {
      complex pos = vPosition / 2.0 + 0.5;
      // scale to be in mandelbrot coordinates
      pos.x = pos.x * (2.0 + 0.47) - 2.0;
      pos.y = pos.y * (1.12 + 1.12) - 1.12;
      pos /= uZoom;
      pos += uOffset;
      gl_FragColor = vec4(mandelbrot(pos), 1.0);
  }
`;

main();

function main() {
  const canvas = document.getElementById("mandelbrot-canvas");
  const canvasDiv = document.getElementById("mandelbrot-canvas-div");
  canvas.width = canvasDiv.clientWidth;
  canvas.height = canvasDiv.clientHeight;

  const gl = canvas.getContext("webgl");
  if (gl === null) {
    alert("Unable to initalize WebGL.");
    return;
  }

  const shaderProgram = loadShaderProgram(gl, vsSource, fsSource);
  gl.useProgram(shaderProgram);

  const positions = new Float32Array([
    -1.0, -1.0,
    -1.0,  1.0,
     1.0,  1.0,
     1.0,  1.0,
     1.0, -1.0,
    -1.0, -1.0,
  ]);
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  const aPositionLoc = gl.getAttribLocation(shaderProgram, "aPosition");
  gl.enableVertexAttribArray(aPositionLoc);
  gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

  let offset = [0.0, 0.0];
  const uOffsetLoc = gl.getUniformLocation(shaderProgram, 'uOffset');
  gl.uniform2f(uOffsetLoc, ...offset);

  let zoom = 1.0;
  const uZoomLoc = gl.getUniformLocation(shaderProgram, 'uZoom');
  gl.uniform1f(uZoomLoc, zoom);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  let keys = {};

  window.addEventListener('keydown', (event) => {
    keys[event.key] = true;
  });
  window.addEventListener('keyup', (event) => {
    keys[event.key] = false;
  });
  window.addEventListener('wheel', (event) => {
    event.preventDefault();
    zoom *= 1.0 - event.deltaY * 0.0002;
  }, { passive: false });
  window.addEventListener('resize', (event) =>  {
    canvas.width = canvasDiv.clientWidth;
    canvas.height = canvasDiv.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  });

  let lastTime = 0;

  function draw(timestamp) {
    let dt = (timestamp - lastTime) / 1000.0;
    lastTime = timestamp;

    if (keys['w']) {
      offset[1] += 0.5 * dt / zoom;
    }
    if (keys['s']) {
      offset[1] -= 0.5 * dt / zoom;
    }
    if (keys['d']) {
      offset[0] += 0.5 * dt / zoom;
    }
    if (keys['a']) {
      offset[0] -= 0.5 * dt / zoom;
    }


    gl.uniform2f(uOffsetLoc, ...offset);
    gl.uniform1f(uZoomLoc, zoom);
    gl.useProgram(shaderProgram);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(draw);
  }

  draw();
}

function loadShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(`Error linking program: ${gl.getProgramInfoLog(shaderProgram)}`);
    return null;
  }

  return shaderProgram;
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(`Error occured compiling shader: ${gl.getShaderInfoLog(shader)}`);
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}
