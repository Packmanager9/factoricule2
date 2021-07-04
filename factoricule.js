
window.addEventListener('DOMContentLoaded', (event) => {
    const gamepadAPI = {
        controller: {},
        turbo: true,
        connect: function (evt) {
            if (navigator.getGamepads()[0] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[1] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[2] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[3] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            }
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i] === null) {
                    continue;
                }
                if (!gamepads[i].connected) {
                    continue;
                }
            }
        },
        disconnect: function (evt) {
            gamepadAPI.turbo = false;
            delete gamepadAPI.controller;
        },
        update: function () {
            gamepadAPI.controller = navigator.getGamepads()[0]
            gamepadAPI.buttonsCache = [];// clear the buttons cache
            for (var k = 0; k < gamepadAPI.buttonsStatus.length; k++) {// move the buttons status from the previous frame to the cache
                gamepadAPI.buttonsCache[k] = gamepadAPI.buttonsStatus[k];
            }
            gamepadAPI.buttonsStatus = [];// clear the buttons status
            var c = gamepadAPI.controller || {}; // get the gamepad object
            var pressed = [];
            if (c.buttons) {
                for (var b = 0, t = c.buttons.length; b < t; b++) {// loop through buttons and push the pressed ones to the array
                    if (c.buttons[b].pressed) {
                        pressed.push(gamepadAPI.buttons[b]);
                    }
                }
            }
            var axes = [];
            if (c.axes) {
                for (var a = 0, x = c.axes.length; a < x; a++) {// loop through axes and push their values to the array
                    axes.push(c.axes[a].toFixed(2));
                }
            }
            gamepadAPI.axesStatus = axes;// assign received values
            gamepadAPI.buttonsStatus = pressed;
            // console.log(pressed); // return buttons for debugging purposes
            return pressed;
        },
        buttonPressed: function (button, hold) {
            var newPress = false;
            for (var i = 0, s = gamepadAPI.buttonsStatus.length; i < s; i++) {// loop through pressed buttons
                if (gamepadAPI.buttonsStatus[i] == button) {// if we found the button we're looking for...
                    newPress = true;// set the boolean variable to true
                    if (!hold) {// if we want to check the single press
                        for (var j = 0, p = gamepadAPI.buttonsCache.length; j < p; j++) {// loop through the cached states from the previous frame
                            if (gamepadAPI.buttonsCache[j] == button) { // if the button was already pressed, ignore new press
                                newPress = false;
                            }
                        }
                    }
                }
            }
            return newPress;
        },
        buttons: [
            'A', 'B', 'X', 'Y', 'LB', 'RB', 'Left-Trigger', 'Right-Trigger', 'Back', 'Start', 'Axis-Left', 'Axis-Right', 'DPad-Up', 'DPad-Down', 'DPad-Left', 'DPad-Right', "Power"
        ],
        buttonsCache: [],
        buttonsStatus: [],
        axesStatus: []
    };
    let canvas
    let canvas_context
    let keysPressed = {}
    let FLEX_engine
    let TIP_engine = {}
    let XS_engine
    let YS_engine
    class Point {
        constructor(x, y) {
            this.x = x
            this.y = y
            this.radius = 0
        }
        pointDistance(point) {
            return (new LineOP(this, point, "transparent", 0)).hypotenuse()
        }
    }
    class Line {
        constructor(x, y, x2, y2, color, width) {
            this.x1 = x
            this.y1 = y
            this.x2 = x2
            this.y2 = y2
            this.color = color
            this.width = width
        }
        angle() {
            return Math.atan2(this.y1 - this.y2, this.x1 - this.x2)
        }
        hypotenuse() {
            let xdif = this.x1 - this.x2
            let ydif = this.y1 - this.y2
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            return Math.sqrt(hypotenuse)
        }
        draw() {
            let linewidthstorage = canvas_context.lineWidth
            canvas_context.strokeStyle = this.color
            canvas_context.lineWidth = this.width
            canvas_context.beginPath()
            canvas_context.moveTo(this.x1, this.y1)
            canvas_context.lineTo(this.x2, this.y2)
            canvas_context.stroke()
            canvas_context.lineWidth = linewidthstorage
        }
    }
    class LineOP {
        constructor(object, target, color, width) {
            this.object = object
            this.target = target
            this.color = color
            this.width = width
        }
        hypotenuse() {
            let xdif = this.object.x - this.target.x
            let ydif = this.object.y - this.target.y
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            return Math.sqrt(hypotenuse)
        }
        sqrDis() {
            let xdif = this.object.x - this.target.x
            let ydif = this.object.y - this.target.y
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            return (hypotenuse)
        }
        angle() {
            return Math.atan2(this.object.y - this.target.y, this.object.x - this.target.x)
        }
        draw() {
            let linewidthstorage = canvas_context.lineWidth
            canvas_context.strokeStyle = this.color
            canvas_context.lineWidth = this.width
            canvas_context.beginPath()
            canvas_context.moveTo(this.object.x, this.object.y)
            canvas_context.lineTo(this.target.x, this.target.y)
            canvas_context.stroke()
            canvas_context.lineWidth = linewidthstorage
        }
    }
    class Triangle {
        constructor(x, y, color, length, fill = 0, strokeWidth = 0, leg1Ratio = 1, leg2Ratio = 1, heightRatio = 1) {
            this.x = x
            this.y = y
            this.color = color
            this.length = length
            this.x1 = this.x + this.length * leg1Ratio
            this.x2 = this.x - this.length * leg2Ratio
            this.tip = this.y - this.length * heightRatio
            this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
            this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
            this.fill = fill
            this.stroke = strokeWidth
        }
        draw() {
            canvas_context.strokeStyle = this.color
            canvas_context.stokeWidth = this.stroke
            canvas_context.beginPath()
            canvas_context.moveTo(this.x, this.y)
            canvas_context.lineTo(this.x1, this.y)
            canvas_context.lineTo(this.x, this.tip)
            canvas_context.lineTo(this.x2, this.y)
            canvas_context.lineTo(this.x, this.y)
            if (this.fill == 1) {
                canvas_context.fill()
            }
            canvas_context.stroke()
            canvas_context.closePath()
        }
        isPointInside(point) {
            if (point.x <= this.x1) {
                if (point.y >= this.tip) {
                    if (point.y <= this.y) {
                        if (point.x >= this.x2) {
                            this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
                            this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
                            this.basey = point.y - this.tip
                            this.basex = point.x - this.x
                            if (this.basex == 0) {
                                return true
                            }
                            this.slope = this.basey / this.basex
                            if (this.slope >= this.accept1) {
                                return true
                            } else if (this.slope <= this.accept2) {
                                return true
                            }
                        }
                    }
                }
            }
            return false
        }
    }
    class Rectangle {
        constructor(x, y, width, height, color, fill = 1, stroke = 0, strokeWidth = 1) {
            this.x = x
            this.y = y
            this.height = height
            this.width = width
            this.color = color
            this.xmom = 0
            this.ymom = 0
            this.stroke = stroke
            this.strokeWidth = strokeWidth
            this.fill = fill
        }
        draw() {
            canvas_context.fillStyle = this.color
            canvas_context.fillRect(this.x, this.y, this.width, this.height)
        }
        move() {
            this.x += this.xmom
            this.y += this.ymom
        }
        isPointInside(point) {
            if (point.x >= this.x) {
                if (point.y >= this.y) {
                    if (point.x <= this.x + this.width) {
                        if (point.y <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            if (point.x + point.radius >= this.x) {
                if (point.y + point.radius >= this.y) {
                    if (point.x - point.radius <= this.x + this.width) {
                        if (point.y - point.radius <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
    }
    class Circle {
        constructor(x, y, radius, color, xmom = 0, ymom = 0, friction = 1, reflect = 0, strokeWidth = 0, strokeColor = "transparent") {
            this.x = x
            this.y = y
            this.age = 0
            this.radius = radius
            this.color = color
            this.xmom = xmom
            this.ymom = ymom
            this.friction = friction
            this.reflect = reflect
            this.strokeWidth = strokeWidth
            this.strokeColor = strokeColor
            this.type =1
        }
        copy(){
            let copy = new Circle(0,0,0,0)
            copy.type = this.type
            copy.radius = this.radius
            copy.y = this.y
            copy.x = this.x
            copy.xmom = this.xmom
            copy.ymom = this.ymom
            copy.color = this.color
            copy.last = this.last
            copy.age = 0
            // copy.gripped = this.gripped
            // copy.marked = this.marked
            return copy
        }
        draw() {

            canvas_context.lineWidth = this.strokeWidth
            if(this.type == 1){
                this.color = "#00FF00"
            }
            if(this.type == 2){
                this.color = "#FF0000"
            }
            if(this.type == 3){
                this.color = "#0000FF"
            }
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath();
            if (this.radius > 0) {
                canvas_context.arc(this.x, this.y, this.radius, 0, (Math.PI * 2), true)
                canvas_context.fillStyle = this.color
                canvas_context.fill()
                canvas_context.stroke();
            } else {
                // console.log("The circle is below a radius of 0, and has not been drawn. The circle is:", this)
            }
        }
        move() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
        }
        unmove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x -= this.xmom
            this.y -= this.ymom
        }
        frictiveMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
            this.xmom *= this.friction
            this.ymom *= this.friction
        }
        frictiveunMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.xmom /= this.friction
            this.ymom /= this.friction
            this.x -= this.xmom
            this.y -= this.ymom
        }
        isPointInside(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.radius * this.radius)) {
                return true
            }
            return false
        }
        doesPerimeterTouch(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= ((this.radius + point.radius) * (this.radius + point.radius))) {
                return true
            }
            return false
        }
    } class Polygon {
        constructor(x, y, size, color, sides = 3, xmom = 0, ymom = 0, angle = 0, reflect = 0) {
            if (sides < 2) {
                sides = 2
            }
            this.reflect = reflect
            this.xmom = xmom
            this.ymom = ymom
            this.body = new Circle(x, y, size - (size * .293), "transparent")
            this.nodes = []
            this.angle = angle
            this.size = size
            this.color = color
            this.angleIncrement = (Math.PI * 2) / sides
            this.sides = sides
            for (let t = 0; t < sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }
        }
        isPointInside(point) { // rough approximation
            this.body.radius = this.size - (this.size * .293)
            if (this.sides <= 2) {
                return false
            }
            this.areaY = point.y - this.body.y
            this.areaX = point.x - this.body.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.body.radius * this.body.radius)) {
                return true
            }
            return false
        }
        move() {
            if (this.reflect == 1) {
                if (this.body.x > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.body.x < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.body.x += this.xmom
            this.body.y += this.ymom
        }
        draw() {
            this.nodes = []
            this.angleIncrement = (Math.PI * 2) / this.sides
            this.body.radius = this.size - (this.size * .293)
            for (let t = 0; t < this.sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }
            canvas_context.strokeStyle = this.color
            canvas_context.fillStyle = this.color
            canvas_context.lineWidth = 0
            canvas_context.beginPath()
            canvas_context.moveTo(this.nodes[0].x, this.nodes[0].y)
            for (let t = 1; t < this.nodes.length; t++) {
                canvas_context.lineTo(this.nodes[t].x, this.nodes[t].y)
            }
            canvas_context.lineTo(this.nodes[0].x, this.nodes[0].y)
            canvas_context.fill()
            canvas_context.stroke()
            canvas_context.closePath()
        }
    }
    class Shape {
        constructor(shapes) {
            this.shapes = shapes
        }
        isPointInside(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].isPointInside(point)) {
                    return true
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].doesPerimeterTouch(point)) {
                    return true
                }
            }
            return false
        }
        isInsideOf(box) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (box.isPointInside(this.shapes[t])) {
                    return true
                }
            }
            return false
        }
        push(object) {
            this.shapes.push(object)
        }
    }
    class Spring {
        constructor(x, y, radius, color, body = 0, length = 1, gravity = 0, width = 1) {
            if (body == 0) {
                this.body = new Circle(x, y, radius, color)
                this.anchor = new Circle(x, y, radius, color)
                this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
                this.length = length
            } else {
                this.body = body
                this.anchor = new Circle(x, y, radius, color)
                this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
                this.length = length
            }
            this.gravity = gravity
            this.width = width
        }
        balance() {
            this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
            if (this.beam.hypotenuse() < this.length) {
                this.body.xmom += (this.body.x - this.anchor.x) / this.length
                this.body.ymom += (this.body.y - this.anchor.y) / this.length
                this.anchor.xmom -= (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom -= (this.body.y - this.anchor.y) / this.length
            } else {
                this.body.xmom -= (this.body.x - this.anchor.x) / this.length
                this.body.ymom -= (this.body.y - this.anchor.y) / this.length
                this.anchor.xmom += (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom += (this.body.y - this.anchor.y) / this.length
            }
            let xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
            let ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
            this.body.xmom = (this.body.xmom + xmomentumaverage) / 2
            this.body.ymom = (this.body.ymom + ymomentumaverage) / 2
            this.anchor.xmom = (this.anchor.xmom + xmomentumaverage) / 2
            this.anchor.ymom = (this.anchor.ymom + ymomentumaverage) / 2
        }
        draw() {
            this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
            this.beam.draw()
            this.body.draw()
            this.anchor.draw()
        }
        move() {
            this.anchor.ymom += this.gravity
            this.anchor.move()
        }

    }  
    class SpringOP {
        constructor(body, anchor, length, width = 3, color = body.color) {
            this.body = body
            this.anchor = anchor
            this.beam = new LineOP(body, anchor, color, width)
            this.length = length
        }
        balance() {
            if (this.beam.hypotenuse() < this.length) {
                this.body.xmom += ((this.body.x - this.anchor.x) / this.length) 
                this.body.ymom += ((this.body.y - this.anchor.y) / this.length) 
                this.anchor.xmom -= ((this.body.x - this.anchor.x) / this.length) 
                this.anchor.ymom -= ((this.body.y - this.anchor.y) / this.length) 
            } else if (this.beam.hypotenuse() > this.length) {
                this.body.xmom -= (this.body.x - this.anchor.x) / (this.length)
                this.body.ymom -= (this.body.y - this.anchor.y) / (this.length)
                this.anchor.xmom += (this.body.x - this.anchor.x) / (this.length)
                this.anchor.ymom += (this.body.y - this.anchor.y) / (this.length)
            }

            let xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
            let ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
            this.body.xmom = (this.body.xmom + xmomentumaverage) / 2
            this.body.ymom = (this.body.ymom + ymomentumaverage) / 2
            this.anchor.xmom = (this.anchor.xmom + xmomentumaverage) / 2
            this.anchor.ymom = (this.anchor.ymom + ymomentumaverage) / 2
        }
        draw() {
            this.beam.draw()
        }
        move() {
            //movement of SpringOP objects should be handled separate from their linkage, to allow for many connections, balance here with this object, move nodes independently
        }
    }

    class Color {
        constructor(baseColor, red = -1, green = -1, blue = -1, alpha = 1) {
            this.hue = baseColor
            if (red != -1 && green != -1 && blue != -1) {
                this.r = red
                this.g = green
                this.b = blue
                if (alpha != 1) {
                    if (alpha < 1) {
                        this.alpha = alpha
                    } else {
                        this.alpha = alpha / 255
                        if (this.alpha > 1) {
                            this.alpha = 1
                        }
                    }
                }
                if (this.r > 255) {
                    this.r = 255
                }
                if (this.g > 255) {
                    this.g = 255
                }
                if (this.b > 255) {
                    this.b = 255
                }
                if (this.r < 0) {
                    this.r = 0
                }
                if (this.g < 0) {
                    this.g = 0
                }
                if (this.b < 0) {
                    this.b = 0
                }
            } else {
                this.r = 0
                this.g = 0
                this.b = 0
            }
        }
        normalize() {
            if (this.r > 255) {
                this.r = 255
            }
            if (this.g > 255) {
                this.g = 255
            }
            if (this.b > 255) {
                this.b = 255
            }
            if (this.r < 0) {
                this.r = 0
            }
            if (this.g < 0) {
                this.g = 0
            }
            if (this.b < 0) {
                this.b = 0
            }
        }
        randomLight() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 12) + 4)];
            }
            var color = new Color(hash, 55 + Math.random() * 200, 55 + Math.random() * 200, 55 + Math.random() * 200)
            return color;
        }
        randomDark() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 12))];
            }
            var color = new Color(hash, Math.random() * 200, Math.random() * 200, Math.random() * 200)
            return color;
        }
        random() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 16))];
            }
            var color = new Color(hash, Math.random() * 255, Math.random() * 255, Math.random() * 255)
            return color;
        }
    }
    class Softbody { //buggy, spins in place
        constructor(x, y, radius, color, members = 10, memberLength = 5, force = 10, gravity = 0) {
            this.springs = []
            this.pin = new Circle(x, y, radius, color)
            this.spring = new Spring(x, y, radius, color, this.pin, memberLength, gravity)
            this.springs.push(this.spring)
            for (let k = 0; k < members; k++) {
                this.spring = new Spring(x, y, radius, color, this.spring.anchor, memberLength, gravity)
                if (k < members - 1) {
                    this.springs.push(this.spring)
                } else {
                    this.spring.anchor = this.pin
                    this.springs.push(this.spring)
                }
            }
            this.forceConstant = force
            this.centroid = new Point(0, 0)
        }
        circularize() {
            this.xpoint = 0
            this.ypoint = 0
            for (let s = 0; s < this.springs.length; s++) {
                this.xpoint += (this.springs[s].anchor.x / this.springs.length)
                this.ypoint += (this.springs[s].anchor.y / this.springs.length)
            }
            this.centroid.x = this.xpoint
            this.centroid.y = this.ypoint
            this.angle = 0
            this.angleIncrement = (Math.PI * 2) / this.springs.length
            for (let t = 0; t < this.springs.length; t++) {
                this.springs[t].body.x = this.centroid.x + (Math.cos(this.angle) * this.forceConstant)
                this.springs[t].body.y = this.centroid.y + (Math.sin(this.angle) * this.forceConstant)
                this.angle += this.angleIncrement
            }
        }
        balance() {
            for (let s = this.springs.length - 1; s >= 0; s--) {
                this.springs[s].balance()
            }
            this.xpoint = 0
            this.ypoint = 0
            for (let s = 0; s < this.springs.length; s++) {
                this.xpoint += (this.springs[s].anchor.x / this.springs.length)
                this.ypoint += (this.springs[s].anchor.y / this.springs.length)
            }
            this.centroid.x = this.xpoint
            this.centroid.y = this.ypoint
            for (let s = 0; s < this.springs.length; s++) {
                this.link = new Line(this.centroid.x, this.centroid.y, this.springs[s].anchor.x, this.springs[s].anchor.y, 0, "transparent")
                if (this.link.hypotenuse() != 0) {
                    this.springs[s].anchor.xmom += (((this.springs[s].anchor.x - this.centroid.x) / (this.link.hypotenuse()))) * this.forceConstant
                    this.springs[s].anchor.ymom += (((this.springs[s].anchor.y - this.centroid.y) / (this.link.hypotenuse()))) * this.forceConstant
                }
            }
            for (let s = 0; s < this.springs.length; s++) {
                this.springs[s].move()
            }
            for (let s = 0; s < this.springs.length; s++) {
                this.springs[s].draw()
            }
        }
    }
    class Observer {
        constructor(x, y, radius, color, range = 100, rays = 10, angle = (Math.PI * .125)) {
            this.body = new Circle(x, y, radius, color)
            this.color = color
            this.ray = []
            this.rayrange = range
            this.globalangle = Math.PI
            this.gapangle = angle
            this.currentangle = 0
            this.obstacles = []
            this.raymake = rays
        }
        beam() {
            this.currentangle = this.gapangle / 2
            for (let k = 0; k < this.raymake; k++) {
                this.currentangle += (this.gapangle / Math.ceil(this.raymake / 2))
                let ray = new Circle(this.body.x, this.body.y, 1, "white", (((Math.cos(this.globalangle + this.currentangle)))), (((Math.sin(this.globalangle + this.currentangle)))))
                ray.collided = 0
                ray.lifespan = this.rayrange - 1
                this.ray.push(ray)
            }
            for (let f = 0; f < this.rayrange; f++) {
                for (let t = 0; t < this.ray.length; t++) {
                    if (this.ray[t].collided < 1) {
                        this.ray[t].move()
                        for (let q = 0; q < this.obstacles.length; q++) {
                            if (this.obstacles[q].isPointInside(this.ray[t])) {
                                this.ray[t].collided = 1
                            }
                        }
                    }
                }
            }
        }
        draw() {
            this.beam()
            this.body.draw()
            canvas_context.lineWidth = 1
            canvas_context.fillStyle = this.color
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath()
            canvas_context.moveTo(this.body.x, this.body.y)
            for (let y = 0; y < this.ray.length; y++) {
                canvas_context.lineTo(this.ray[y].x, this.ray[y].y)
                canvas_context.lineTo(this.body.x, this.body.y)
            }
            canvas_context.stroke()
            canvas_context.fill()
            this.ray = []
        }
    }
    function setUp(canvas_pass, style = "#AAAAAA") {
        canvas = canvas_pass
        canvas_context = canvas.getContext('2d');
        canvas.style.background = style
        window.setInterval(function () {
            main()
        }, 17)
        document.addEventListener('keydown', (event) => {
            keysPressed[event.key] = true;
        });
        document.addEventListener('keyup', (event) => {
            delete keysPressed[event.key];
        });
        window.addEventListener('pointerdown', e => {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            console.log(canvas_context.getTransform())
            TIP_engine.x = XS_engine/3- canvas_context.getTransform().e/3
            TIP_engine.y = YS_engine/3 - canvas_context.getTransform().f/3
            TIP_engine.body = TIP_engine
            // example usage: if(object.isPointInside(TIP_engine)){ take action }
            if(keysPressed['n']){
                for(let t = 0;t<grid.blocks.length;t++){
                    if(grid.blocks[t].glob.isPointInside(TIP_engine)){
                        grid.blocks[t].belt = 1
                        grid.blocks[t].xdir = 1
                        grid.blocks[t].ydir = 0
                    }
                }
            }
            if(keysPressed['v']){
                for(let t = 0;t<grid.blocks.length;t++){
                    if(grid.blocks[t].glob.isPointInside(TIP_engine)){
                        grid.blocks[t].belt = 1
                        grid.blocks[t].xdir = -1
                        grid.blocks[t].ydir = 0
                    }
                }
            }
            if(keysPressed['g']){
                for(let t = 0;t<grid.blocks.length;t++){
                    if(grid.blocks[t].glob.isPointInside(TIP_engine)){
                        grid.blocks[t].belt = 1
                        grid.blocks[t].xdir = 0
                        grid.blocks[t].ydir = -1
                    }
                }
            }
            if(keysPressed['b']){
                for(let t = 0;t<grid.blocks.length;t++){
                    if(grid.blocks[t].glob.isPointInside(TIP_engine)){
                        grid.blocks[t].belt = 1
                        grid.blocks[t].xdir = 0
                        grid.blocks[t].ydir = 1
                    }
                }
            }
            if(keysPressed['r']){
                for(let t = 0;t<grid.blocks.length;t++){
                    if(grid.blocks[t].glob.isPointInside(TIP_engine)){
                        candyman.structures.push(new Arm(grid.blocks[t]))
                        candyman.selectedindex++
                    }
                }
            }


            // this.belt = 1
            // if(Math.random()<.3){
            //     this.xdir = 1
            // }else if(Math.random()<.3){
            //     this.xdir = -1
            // }else{
            //     this.xdir = 0
            //     if(Math.random()<.3){
            //         this.ydir = 1
            //     }else if(Math.random()<.3){
            //         this.ydir = -1
            //     }else{
            //         this.ydir = 0
            //     }
        });
        window.addEventListener('pointermove', continued_stimuli);

        window.addEventListener('pointerup', e => {
            // window.removeEventListener("pointermove", continued_stimuli);
        })
        function continued_stimuli(e) {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            TIP_engine.x = XS_engine
            TIP_engine.y = YS_engine
            TIP_engine.body = TIP_engine
        }
    }
    function gamepad_control(object, speed = 1) { // basic control for objects using the controler
//         console.log(gamepadAPI.axesStatus[1]*gamepadAPI.axesStatus[0]) //debugging
        if (typeof object.body != 'undefined') {
            if(typeof (gamepadAPI.axesStatus[1]) != 'undefined'){
                if(typeof (gamepadAPI.axesStatus[0]) != 'undefined'){
                object.body.x += (gamepadAPI.axesStatus[0] * speed)
                object.body.y += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        } else if (typeof object != 'undefined') {
            if(typeof (gamepadAPI.axesStatus[1]) != 'undefined'){
                if(typeof (gamepadAPI.axesStatus[0]) != 'undefined'){
                object.x += (gamepadAPI.axesStatus[0] * speed)
                object.y += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        }
    }
    function control(object, speed = 1) { // basic control for objects
        if (typeof object.body != 'undefined') {
            if (keysPressed['w']) {
                object.body.y -= speed
            }
            if (keysPressed['d']) {
                object.body.x += speed
            }
            if (keysPressed['s']) {
                object.body.y += speed
            }
            if (keysPressed['a']) {
                object.body.x -= speed
            }
        } else if (typeof object != 'undefined') {
            if (keysPressed['w']) {
                object.y -= speed
            }
            if (keysPressed['d']) {
                object.x += speed
            }
            if (keysPressed['s']) {
                object.y += speed
            }
            if (keysPressed['a']) {
                object.x -= speed
            }
        }
    }
    function getRandomLightColor() { // random color that will be visible on  black background
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 12) + 4)];
        }
        return color;
    }
    function getRandomColor() { // random color
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 16) + 0)];
        }
        return color;
    }
    function getRandomDarkColor() {// color that will be visible on a black background
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 12))];
        }
        return color;
    }
    function castBetween(from, to, granularity = 10, radius = 1) { //creates a sort of beam hitbox between two points, with a granularity (number of members over distance), with a radius defined as well
            let limit = granularity
            let shape_array = []
            for (let t = 0; t < limit; t++) {
                let circ = new Circle((from.x * (t / limit)) + (to.x * ((limit - t) / limit)), (from.y * (t / limit)) + (to.y * ((limit - t) / limit)), radius, "red")
                shape_array.push(circ)
            }
            return (new Shape(shape_array))
    }

    let setup_canvas = document.getElementById('canvas') //getting canvas from document

    setUp(setup_canvas) // setting up canvas refrences, starting timer. 

    // object instantiation and creation happens here 

    canvas_context.scale(3,3)

    class Player {
        constructor(){
            this.body = new Circle(100,100, 4, "#FFFFFF")
            this.tile = grid.blocks[Math.round(grid.w*11.15)]
            this.structures = []
            this.selectedindex = -1
        }
        draw(){
            this.body.x = this.tile.glob.x
            this.body.y = this.tile.glob.y

            this.body.draw()
            this.dispx = this.body.x
            this.dispy = this.body.y
            if(keysPressed['w']){
                this.body.y -= this.tile.body.height
            }
            if(keysPressed['a']){
                this.body.x -= this.tile.body.width
            }
            if(keysPressed['s']){
                this.body.y += this.tile.body.height
            }
            if(keysPressed['d']){
                this.body.x += this.tile.body.width
            }
            
            let wet = 0
            for(let t = 0;t<this.tile.neighbors.length;t++){
                if(grid.blocks[this.tile.neighbors[t]].mglob.isPointInside(this.body)){
                    this.tile = grid.blocks[this.tile.neighbors[t]]
                    wet = 1
                }
            }
            if(wet == 0){
                for(let t = 0;t<grid.blocks.length;t++){
                    if(grid.blocks[t].mglob.isPointInside(this.body)){
                        this.tile = grid.blocks[t]
                    }
                }
                    
                
            }



            this.body.x = this.tile.glob.x
            this.body.y = this.tile.glob.y
            this.dispx = this.dispx-this.tile.glob.x
            this.dispy = this.dispy-this.tile.glob.y
            canvas_context.translate(this.dispx, this.dispy)
            for(let t =0;t<this.structures.length;t++){
                this.structures[t].draw()
            }
        }
    }

    class Grid{
        constructor(scale){
            this.blocks = []
            let w = 1280/scale
            let h = 720/scale
            this.w = w
            this.scale = scale
            for(let t = 0;t<w*h;t++){

                    let brick = new Atom((t%w)*scale, Math.floor(t/w)*scale, scale, scale, "#292929")
                    this.blocks.push(brick)
            }

            for(let t = 0;t<110;t++){
            this.perlin()
            }
            this.giveAtoms()
            
            for(let t = 0;t<this.blocks.length;t++){
                for(let index = 0;index<this.blocks.length;index++){
                    if(index!=t){

                        if(this.blocks[t].glob.doesPerimeterTouch(this.blocks[index].glob)){
                            if(!this.blocks[t].neighbors.includes(index)){
                                if(!this.blocks[index].neighbors.includes(t)){
                                this.blocks[t].neighbors.push(index)
                                this.blocks[index].neighbors.push(t)
                                }
                            }
                        }
                    }
                }

            }
        }
        giveAtoms(){
            for(let t = 0;t<this.blocks.length;t++){
                this.blocks[t].getAtoms()
            }

        }
        perlin(){
            let jiggler = 110
            for(let h = 0;h<jiggler;h++){
                for(let t = 0;t<this.blocks.length;t++){
                    let index = Math.floor(Math.random()*this.blocks.length)
                    while(index == t){
                        index = Math.floor(Math.random()*this.blocks.length)
                    }
                    // for(let k = 0;k<this.blocks.length;k++){
                        // if(t!= k){
                            if(this.blocks[t].hydrogen > 0 || this.blocks[t].carbon > 0 || this.blocks[t].nitrogen > 0 ){
                                if(this.blocks[t].glob.doesPerimeterTouch(this.blocks[index].glob)){
                                    if(!this.blocks[t].neighbors.includes(index)){
                                        this.blocks[t].neighbors.push(index)
                                        this.blocks[index].neighbors.push(t)
                                    }
                                    let split = 2.5
                                    this.blocks[index].hydrogen += this.blocks[t].hydrogen/split
                                    this.blocks[t].hydrogen -= this.blocks[t].hydrogen/split
                                    if(this.blocks[t].hydrogen < 20){
                                        this.blocks[t].hydrogen = 20
                                    }
                                    let slpat = 4.5
                                    this.blocks[index].nitrogen += this.blocks[t].nitrogen/slpat
                                    this.blocks[t].nitrogen -= this.blocks[t].nitrogen/slpat
                                    if(this.blocks[t].nitrogen < 20){
                                        this.blocks[t].nitrogen = 0
                                    }
                                    let splut = 3.5
                                    this.blocks[index].carbon += this.blocks[t].carbon/splut
                                    this.blocks[t].carbon -= this.blocks[t].carbon/splut
                                    if(this.blocks[t].carbon < 20){
                                        this.blocks[t].carbon = 0
                                    }
                                }
                            }else{

                            }
                        // }
                    // }

                }
            }
        }
        draw(){
            for(let t = 0;t<this.blocks.length;t++){
                this.blocks[t].draw()
            }
            for(let t = 0;t<this.blocks.length;t++){
                this.blocks[t].runBelt()
            }
            for(let t = 0;t<this.blocks.length;t++){
                this.blocks[t].cleandots()
            }
            for(let t = 0;t<this.blocks.length;t++){
                this.blocks[t].atomize()
            }
            for(let t = 0;t<this.blocks.length;t++){
                this.blocks[t].cleandots()
            }
            for(let t = 0;t<this.blocks.length;t++){
                this.blocks[t].freeDots()
            }
        }
    }

    class Arm{
        constructor(tile){
            this.grip = -10
            this.timer = 0
            this.time = 40
            this.tile = tile
            this.xdir = 0
            this.ydir = -1
            this.nodes = []
            this.angle = 1
            this.subind = Math.floor(Math.random()*1280)
            this.center = new Circle(this.tile.glob.x, this.tile.glob.y, 2, "#FFFFFF")
            this.crotch = new Circle(this.tile.glob.x, this.tile.glob.y, .7, "#FFFFFF")
            
            this.lp = new Circle(this.tile.glob.x, this.tile.glob.y, .7, "#FFFFFF")
            this.rp = new Circle(this.tile.glob.x, this.tile.glob.y, .7, "#FFFFFF")
            this.lf = new Circle(this.tile.glob.x, this.tile.glob.y, .7, "#FFFFFF")
            this.rf = new Circle(this.tile.glob.x, this.tile.glob.y, .7, "#FFFFFF")
            this.g = new Circle(this.tile.glob.x, this.tile.glob.y, 2, "#FFFFFF")
            this.nodes.push(this.center)
            this.nodes.push(this.crotch)
            this.nodes.push(this.lp)
            this.nodes.push(this.rp)
            this.nodes.push(this.lf)
            this.nodes.push(this.rf)
            this.length = 24
            this.particle = new Circle(-10000,-10000, 1, "#FFFFFF")
            this.particle.type = 0
            this.links = []
            let link = new LineOP(this.center, this.crotch, "#AAAAAA", .5)
            this.links.push(link)
            let link2 = new LineOP(this.crotch, this.lp, "#AAAAAA", .5)
            this.links.push(link2)
            let link3 = new LineOP(this.crotch, this.rp, "#AAAAAA", .5)
            this.links.push(link3)
            let link4 = new LineOP(this.rp, this.rf, "#AAAAAA", .5)
            this.links.push(link4)
            let link5 = new LineOP(this.lp, this.lf, "#AAAAAA", .5)
            this.links.push(link5)
            this.startangle = Math.random()*Math.PI*2
            this.endangle = Math.random()*Math.PI*2
        }
        drop(){

            for(let t = 0;t<grid.blocks.length;t++){
                if(grid.blocks[t].body.isPointInside(this.g)){
                    if(this.particle.type == 1){
                        grid.blocks[t].hydrogen+= 50
                        grid.blocks[t].dots.unshift(this.particle.copy())
                        // this.particle.marked = 1
                        // this.particle.type = 0
                    }
                    if(this.particle.type == 2){
                        grid.blocks[t].carbon+= 50
                        grid.blocks[t].dots.unshift(this.particle.copy())
                        // this.particle.marked = 1
                        // this.particle.type = 0
                    }
                    if(this.particle.type == 3){
                        grid.blocks[t].nitrogen+= 50
                        grid.blocks[t].dots.unshift(this.particle.copy())
                        // this.particle.marked = 1
                        // this.particle.type = 0
                    }

                    if(this.particle.type ==1){
                        grid.blocks[this.subind].hydrogen-=50
                    }
                    if(this.particle.type ==2){
                        grid.blocks[this.subind].carbon-=50
                    }
                    if(this.particle.type ==3){
                        grid.blocks[this.subind].nitrogen-=50
                    } 
                    this.particle.marked = 1
                    // this.particle.type = 0
                    this.particle = new Circle(0,0,0,"transparent")
                    this.particle.type = 0

                    grid.blocks[this.subind].cleandots()
                        continue
                        // break
                }
            }
        }
        grab(){
            // if(this.particle.type != 0){
            //     return
            // }

            this.g.x = (this.lf.x+this.rf.x)/2
            this.g.y = (this.lf.y+this.rf.y)/2
            for(let t = 0;t<grid.blocks.length;t++){
                if(grid.blocks[t].body.isPointInside(this.g)){
                    if(Math.min(grid.blocks[t].dotwork, grid.blocks[t].dots.length) > 0){
                        this.grip = 16
                        this.particle = grid.blocks[t].dots[grid.blocks[t].dotwork-1]
                        this.particle.gripped = 1
                        // this.particle.type = 1
                    
                        this.subind = t
                    }
                    break

                }
            }

        }
        draw(){
            // if(this.center.isPointInside(TIP_engine)){
                    if(candyman.structures.indexOf(this) == candyman.selectedindex){
                        
                if(keysPressed['i']){
                    this.startangle+=.051
                    if(this.startangle>Math.PI*2){
                        this.startangle=0
                    }
                }
                if(keysPressed['k']){
                    this.startangle-=.051
                    if(this.startangle<0){
                        this.startangle = Math.PI*2
                    }
                }
                if(keysPressed['j']){
                    this.endangle-=.051
                    if(this.endangle<0){
                        this.endangle = Math.PI*2
                    }
                }
                if(keysPressed['l']){
                    this.endangle+=.051
                    if(this.endangle>Math.PI*2){
                        this.endangle=0
                    }
                }

            }
            // }
            this.crotch.x = this.center.x +( Math.cos(this.angle)*this.length)
            this.crotch.y = this.center.y +( Math.sin(this.angle)*this.length)
            if(this.grip == 0){
            this.lp.x = this.center.x +( Math.cos(this.angle+.15)*this.length*1.13)
            this.lp.y = this.center.y +( Math.sin(this.angle+.15)*this.length*1.13)
            this.rp.x = this.center.x +( Math.cos(this.angle-.15)*this.length*1.13)
            this.rp.y = this.center.y +( Math.sin(this.angle-.15)*this.length*1.13)
                this.rf.x = this.center.x +( Math.cos(this.angle-.07)*this.length*1.27)
                this.rf.y = this.center.y +( Math.sin(this.angle-.07)*this.length*1.27)
                this.lf.x = this.center.x +( Math.cos(this.angle+.07)*this.length*1.27)
                this.lf.y = this.center.y +( Math.sin(this.angle+.07)*this.length*1.27)
                this.g.x = this.center.y +( Math.cos(this.angle)*this.length*1.26)
                this.g.y = this.center.y +( Math.sin(this.angle)*this.length*1.26)
                this.grip = 1
            }else{

            this.lp.x = this.center.x +( Math.cos(this.angle+.1+((this.grip-10)*-.007))*this.length*1.15)
            this.lp.y = this.center.y +( Math.sin(this.angle+.1+((this.grip-10)*-.007))*this.length*1.15)
            this.rp.x = this.center.x +( Math.cos(this.angle-.1-((this.grip-10)*-.007))*this.length*1.15)
            this.rp.y = this.center.y +( Math.sin(this.angle-.1-((this.grip-10)*-.007))*this.length*1.15)
                this.rf.x = this.center.x +( Math.cos(this.angle-.07-((this.grip-10)*-.01))*this.length*1.26)
                this.rf.y = this.center.y +( Math.sin(this.angle-.07-((this.grip-10)*-.01))*this.length*1.26)
                this.lf.x = this.center.x +( Math.cos(this.angle+.07+((this.grip-10)*-.01))*this.length*1.26)
                this.lf.y = this.center.y +( Math.sin(this.angle+.07+((this.grip-10)*-.01))*this.length*1.26)
                this.g.x = this.center.y +( Math.cos(this.angle)*this.length*1.26)
                this.g.y = this.center.y +( Math.sin(this.angle)*this.length*1.26)
            }

            this.g.x = (this.lf.x+this.rf.x)/2
            this.g.y = (this.lf.y+this.rf.y)/2
            // this.grip%=17
            this.angle += .05
            this.angle%=6.283

            this.particle.x = (this.lf.x+this.rf.x)/2
            this.particle.y = (this.lf.y+this.rf.y)/2
            if(this.particle.type != 0){
                this.particle.draw()
            }
            if(this.angle > this.startangle && this.angle< this.startangle+.07){
                this.drop()
                this.grip = 0
            }
            if(this.angle > this.endangle && this.angle<this.endangle+.07){
                this.grab()
                this.grip+=.4
                if(this.grip > 16){
                    this.grip = 16
                }
                this.angle-=.0485
            }
            let point = new Point(this.center.x+(Math.cos(this.startangle)*5), this.center.y+(Math.sin(this.startangle)*5))
            let point2 = new Point(this.center.x+(Math.cos(this.endangle)*5), this.center.y+(Math.sin(this.endangle)*5))

            let link1 =new LineOP(this.center, point, "#00FF00", .5)
            let link2 =new LineOP(this.center, point2, "#FF0000", .5)
            for(let t = 0;t<this.links.length;t++){
                this.links[t].draw()
            }
            for(let t = 0;t<this.nodes.length;t++){
                this.nodes[t].draw()
            }
            link2.draw()
            link1.draw()
        }
    }

    class Atom{
        constructor(x,y, h,w, color){
            this.dotwork = 0
            this.dotworkx = 0
            this.neighbors = []
            this.dots = []
            this.body = new Rectangle(x,y,w,h,color)
            this.glob = new Circle(x+w*.5,y+w*.5,w*.5,getRandomColor())
            this.mglob = new Circle(x+w*.5,y+w*.5,w*.05,getRandomColor())
            this.type = 0
            this.belt = 0
            this.xdir = 0
            this.ydir = 0
            for(let t = 0; t<16;t++){
                if(Math.random()>.5){
                    this.type += 1
                }
            }
            if(this.type<5){
                this.kind = 0
            }
            if(this.type == 13){
                this.kind = 1
                this.hydrogen = (Math.random()*1000)+450
            }else{
                this.hydrogen = 0
            }
            if(this.type == 13){
                if(Math.random()<.5){
                    this.kind = 1
                    this.nitrogen = (Math.random()*500)+450
                    this.hydrogen = 0
                }else{
                this.nitrogen = 0

                }
            }else{
                this.nitrogen = 0
            }
            if(this.type == 14){
                this.kind = 1
                this.carbon = (Math.random()*200)+450
            }else{
                this.carbon = 0
            }

        }
        runBelt(){
            let point = new Point(this.glob.x + this.xdir*2, this.glob.y + this.ydir*2)
            let link = new LineOP(this.glob, point, "#FFFF00AA", 1)
            if(this.belt == 1){
                for(let t = 0;t<Math.min(this.dotwork, this.dots.length);t++){
                    if(this.body.isPointInside(this.dots[t])){
                    this.dots[t].x+=.11*this.xdir
                    this.dots[t].y+=.11*this.ydir
                    this.dots[t].gripped = 1
                    this.dots[t].last = grid.blocks.indexOf(this)
                    }
                    if(!this.body.isPointInside(this.dots[t])){
                        this.dots[t].x+=.01*this.xdir
                        this.dots[t].y+=.01*this.ydir
                        for(let k = 0;k<this.neighbors.length;k++){
                            if(this.neighbors[k] == this.dots[t].last){
                                console.log(this)
                                continue
                            }
                            if(grid.blocks[this.neighbors[k]].body.isPointInside(this.dots[t])){
                                if(this.dots[t].type == 1){                                    
                                    // console.log(grid.blocks[this.neighbors[k]].dots, grid.blocks[this.neighbors[k]].dots.length)

                                    this.hydrogen-=50
                                    grid.blocks[this.neighbors[k]].hydrogen += 50
                                    grid.blocks[this.neighbors[k]].dots.unshift(this.dots[t].copy())
                                    // console.log(grid.blocks[this.neighbors[k]].dots, grid.blocks[this.neighbors[k]].dots.length)

                                    // for(let r = 0;r<grid.blocks[this.neighbors[k]].dots.length;r++){
                                    //     grid.blocks[this.neighbors[k]].dots[r].type =1
                                    // }
                                this.dots[t].marked = 1
                                }
                                if(this.dots[t].type == 2){
                                    this.carbon-=50
                                    grid.blocks[this.neighbors[k]].carbon += 50
                                    grid.blocks[this.neighbors[k]].dots.unshift(this.dots[t].copy())
                                    // for(let r = 0;r<grid.blocks[this.neighbors[k]].dots.length;r++){
                                    //     grid.blocks[this.neighbors[k]].dots[r].type =2
                                    // }
                                    this.dots[t].marked = 1
                                    // t--
                                }
                                if(this.dots[t].type == 3){
                                    this.nitrogen-=50
                                    grid.blocks[this.neighbors[k]].nitrogen += 50
                                    grid.blocks[this.neighbors[k]].dots.unshift(this.dots[t].copy())
                                    // t--
                                    // for(let r = 0;r<grid.blocks[this.neighbors[k]].dots.length;r++){
                                    //     grid.blocks[this.neighbors[k]].dots[r].type =3
                                    // }
                                    this.dots[t].marked = 1

                                }
                                break
                            }
                        }
                    }else{
                    }
                }
            }
            link.draw()
            this.cleandots()
        }
        cleandots(){
            for(let t =0;t<this.dots.length;t++){
                if(this.dots[t].marked == 1){
                    this.dots.splice(t,1)
                    // t--
                    console.log("dawhkdj")
                }
            }
        }
        getAtoms(){

            for(let t = 0;t<Math.ceil((this.hydrogen+this.nitrogen+this.carbon)/50);t++){
                let atom = new Circle(this.glob.x, this.glob.y, .5, "#FFFFFF", Math.random()-.5, Math.random()-.5)
                atom.type = 1
                if(this.hydrogen > this.carbon && this.hydrogen > this.nitrogen){
                    atom.type = 1
                }
                if(this.carbon > this.hydrogen && this.carbon > this.nitrogen){
                    atom.type = 2
                }
                if(this.nitrogen > this.carbon && this.nitrogen > this.hydrogen){
                    atom.type = 3
                }

                this.dots.push(atom)
         
            }
        }
        draw(){
            this.cleandots()
            this.body.color = `rgb(${this.carbon/4}, ${this.hydrogen/4}, ${this.nitrogen/4})`
            this.body.draw()

            if(this.hydrogen<50){
                this.hydrogen=0
            }
            if(this.carbon<50){
                this.carbon=0
            }
            if(this.nitrogen<50){
                this.nitrogen=0
            }
            // this.glob.draw()
        }
        freeDots(){
            this.dotwork =Math.ceil((this.hydrogen+this.nitrogen+this.carbon)/50)
            // console.log(this.hydrogen, this.carbon, this.nitrogen)
                while(this.dotwork > this.dots.length){
                    let atom = new Circle(this.glob.x, this.glob.y, .5, "#FFFFFF", Math.random()-.5, Math.random()-.5)
                    atom.type = 1
                    this.dots.push(atom)
                }
        
        }
        atomize(){

            for(let t = 0;t<Math.min(this.dotwork, this.dots.length);t++){
                if(this.dots[t].type == 1){

                    this.dots[t].color= "#00FF00"
                }
                // if(this.carbon > this.hydrogen && this.carbon > this.nitrogen){

                    if(this.dots[t].type == 2){
                    this.dots[t].color = "#FF0000"
                }
                // if(this.nitrogen > this.carbon && this.nitrogen > this.hydrogen){

                    if(this.dots[t].type == 3){
                    this.dots[t].color = "#0000ff"
                }
                if(this.dots[t].gripped != 1 || this.belt == 1){

                    let link = new LineOP(this.body, candyman.body)
                    if(link.sqrDis() < 66000){
                        if(this.dots[t].age >0){
                            this.dots[t].draw()
                        }else{
                            this.dots[t].age++
                        }
                        
                    if (this.dots[t].x + this.dots[t].radius > this.body.x+this.body.width) {
                        if (this.dots[t].xmom > 0) {
                            this.dots[t].xmom *= -1
                        }
                    }
                    if (this.dots[t].y + this.dots[t].radius > this.body.y+this.body.height) {
                        if (this.dots[t].ymom > 0) {
                            this.dots[t].ymom *= -1
                        }
                    }
                    if (this.dots[t].x - this.dots[t].radius < this.body.x) {
                        if (this.dots[t].xmom < 0) {
                            this.dots[t].xmom *= -1
                        }
                    }
                    if (this.dots[t].y - this.dots[t].radius < this.body.y) {
                        if (this.dots[t].ymom < 0) {
                            this.dots[t].ymom *= -1
                        }
                    }
                
                    if(this.belt == 1){
                        this.dots[t].x += this.dots[t].xmom*.05
                        this.dots[t].y += this.dots[t].ymom*.05
                    }else{
                        this.dots[t].x += this.dots[t].xmom
                        this.dots[t].y += this.dots[t].ymom
                    }
                }
            // this.dots[t].color =  `rgb(${Math.max(this.carbon*4, 100)}, ${Math.max(this.hydrogen*4,100)}, ${Math.max(this.nitrogen*4,100)})`
                // if(this.dots[t].gripped!=1 ){

                    // if(this.hydrogen > this.carbon && this.hydrogen > this.nitrogen){
                        if(this.dots[t].type == 1){

                        this.dots[t].color= "#00FF00"
                    }
                    // if(this.carbon > this.hydrogen && this.carbon > this.nitrogen){

                        if(this.dots[t].type == 2){
                        this.dots[t].color = "#FF0000"
                    }
                    // if(this.nitrogen > this.carbon && this.nitrogen > this.hydrogen){

                        if(this.dots[t].type == 3){
                        this.dots[t].color = "#0000ff"
                    }
                // }
                }else if(this.belt == 1){
                    let link = new LineOP(this.body, candyman.body)
                    if(link.sqrDis() < 66000){
                        if(this.dots[t].age > 0){
                            this.dots[t].draw()
                        }else{
                            this.dots[t].age++
                        }
                    }
                }
            }
            // for(let t = 0;t<this.dots.length;t++){
           
            // }
        }
    }

    let grid = new Grid(10)
    let candyman = new Player()
    function main() {
        canvas_context.clearRect(-1290, -720, canvas.width*10, canvas.height*10)  // refreshes the image
        gamepadAPI.update() //checks for button presses/stick movement on the connected controller)
        // game code goes here

        grid.draw()
        candyman.draw()
    }
})
