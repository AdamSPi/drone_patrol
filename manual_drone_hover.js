var arDrone = require('ar-drone');

var client = arDrone.createClient();
var control = new arDrone.UdpControl();

var pitch = 0;
var roll = 0;
var yaw = 0;

var xVel = 0;
var yVel = 0;
var zVel = 0;

var init_pitch = 0;
var init_roll = 0;
var init_yaw = 0;
var flying = false;

client.disableEmergency();
client.ftrim();
client.config('general:navdata_demo', 'FALSE');

// negative pitch is forward
// positive pitch is backward
// negative roll is left
// positive roll is right
// negative yaw is ccw
// positive yaw is cw
client.on('navdata', function(navdata) {
    if(navdata.rawMeasures && navdata.demo && navdata.pwm){
        if (!flying) {
            console.log("Battery at " + navdata.demo.batteryPercentage + "%\n");
            init_pitch = navdata.demo.rotation.pitch;
            init_roll = navdata.demo.rotation.roll;
            init_yaw = navdata.demo.rotation.yaw;
        }
        pitch = -init_pitch + navdata.demo.rotation.pitch;
        roll = -init_roll + navdata.demo.rotation.roll;
        yaw = -init_yaw + navdata.demo.rotation.yaw;
        flying = true;
        console.log("Received navdata from drone.\n");
        console.log("Pitch: " + pitch + 
        			"\nRoll: " + roll + 
                    "\nYaw: " + yaw + "\n");
    }
});

function send_packet(maneuver = {}) {
    // This command makes sure your drone hovers in place and does not drift.
    control.pcmd(maneuver);
    // This causes the actual udp message to be send (multiple commands are
    // combined into one message)
    control.flush();
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function repeat(action, duration) {
    var live = true;
    setTimeout(function () {
        live = false;
    }, duration);

    while (live) {
        action();
        await sleep(30);
    }
}

// Take off
async function takeoff() {
	console.log("Taking off...\n");
    await repeat(
        function() {
            // The emergency: true option recovers your drone from emergency mode that can
            // be caused by flipping it upside down or the drone crashing into something.
            // In a real program you probably only want to send emergency: true for one
            // second in the beginning, otherwise your drone may attempt to takeoff again
            // after a crash.
            control.ref({fly: true, emergency: true});
            send_packet();
        }, 2000);
    await hover(3000);
}

async function land() {
	console.log("Landing...\n");
    await repeat(
        function() {
            control.ref({fly: false, emergency: false});
            send_packet();
        }, 3000);
}

process.on('SIGINT', function() {
    console.log('Landing...');
    client.stop();
    client.land();
    process.exit(0);
});

async function descend(duration) {
    await repeat(
        function() {
            maneuver = { down: .2}
            send_packet(maneuver);
    }, duration);
}

function navdata_to_speed(val) {
    return val/(-20);
};

async function hover(duration) {
    console.log("Hovering...\n");
    await repeat(
        function() {
            maneuver = { /* front: -navdata_to_speed(pitch),
                            left: -navdata_to_speed(roll) */ };
            send_packet(maneuver);
        }, duration);
}

async function move_forward(duration) {
	console.log("Going forward...\n");
    await repeat(
        function() {
            maneuver = { front: .5,
                         left: -navdata_to_speed(roll) };
            console.log("Sending packet:\n\tfront: .5" +
            			"\n\tleft: " + -navdata_to_speed(roll));
            send_packet(maneuver);
        }, duration);
    await repeat(
        function() {
            maneuver = { front: -.65,
                         left: -navdata_to_speed(roll) };
            console.log("Sending packet:\n\tfront: -.65" +
            			"\n\tleft: " + -navdata_to_speed(roll));
            send_packet(maneuver);
        }, 700);
}

async function move_backward(duration) {
	console.log("Going backward...\n");
    await repeat(
        function() {
            maneuver = { back: .5,
                         left: -navdata_to_speed(roll) };
            console.log("Sending packet:\n\tback: .5" +
            			"\n\tleft: " + -navdata_to_speed(roll));
            send_packet(maneuver);
        }, duration);
    await repeat(
        function() {
            maneuver = { back: -.65,
                         left: -navdata_to_speed(roll) };
            console.log("Sending packet:\n\tback: -.65" +
            			"\n\tleft: " + -navdata_to_speed(roll));
            send_packet(maneuver);
        }, 700);
}

async function move_left(duration) {
	console.log("Going left...\n");
    await repeat(
        function() {
            maneuver = { left: .5,
                         front: -navdata_to_speed(pitch) };
            console.log("Sending packet:\n\tleft: .5" +
            			"\n\tfront: " + -navdata_to_speed(pitch));
            send_packet(maneuver);
        }, duration);
    await repeat(
        function() {
            maneuver = { left: -.65,
                         front: -navdata_to_speed(pitch) };
            console.log("Sending packet:\n\tleft: -.65" +
            			"\n\tfront: " + -navdata_to_speed(pitch));
            send_packet(maneuver);
        }, 700);
}

async function move_right(duration) {
	console.log("Going right...\n");
    await repeat(
        function() {
            maneuver = { right: .5,
                         front: -navdata_to_speed(pitch) };
            console.log("Sending packet:\n\tright: .5" +
            			"\n\tfront: " + -navdata_to_speed(pitch));
            send_packet(maneuver);
        }, duration);
    await repeat(
        function() {
            maneuver = { right: -.65,
                         front: -navdata_to_speed(pitch) };
            console.log("Sending packet:\n\tright: -.65" +
            			"\n\tfront: " + -navdata_to_speed(pitch));
            send_packet(maneuver);
        }, 700);
}

/* Table A: go forward and back */
async function mission_engage() {
    await takeoff();
    /*
    await descend(700);
    await hover(500);
    await move_forward(1400);
    await hover(1000);
    await move_backward(1400);
    */
    await hover(10000);
    await land();
}
async function main() {
    await mission_engage();
    process.exit();
}

main();