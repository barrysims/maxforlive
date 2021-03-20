//			x
//			|
//		metro 16 n
//			|
//			o
//			|
//	  js launcher.js

var sequence = [0,1,2,3,0,1,2,3,0,1,2,3]

///////////////////////////////////////////////////////////////

inlets = 1;

// is the transport playing
var playing = false;

// ready for next clip to be fired
var ready = false;

// which track are we following
var track = 0;

// currently playing slot
var slot = 0;

// observe the transport
var transport = new LiveAPI(observeTransport);
transport.path = "live_set";
transport.property = "is_playing";
		
// the live set	
var live = new LiveAPI("live_set");	
live.call("stop_all_clips", 0);

// get and log the time signature (we don't need this)
var sigNum = live.get("signature_numerator");
var sigDen = live.get("signature_denominator");
log(sigNum + "/" + sigDen);
		
// observe the track's slot
var this_track = new LiveAPI(observeSlot);
this_track.path = "live_set tracks " + track;
this_track.property = "playing_slot_index";

// for reading the slot's clip
var this_clip = new LiveAPI("live_set");

// start index of clip array	
var seqPointer = 0;

// how many 16th notes till next clip launches
var teenthsTillNextClip = 0;

// Are we ready for next clip? (deprecate)		
var ready = true;

// start the initial clip		
launchNextClip();	


// On every 16th
function bang() {
	teenthsTillNextClip--;
	if (playing && ready && teenthsTillNextClip <= 1) {
		launchNextClip();
		ready = false;
	}
}

function launchNextClip() {
	var next = sequence[seqPointer];
	seqPointer++;
	
	log("launching: ", next);
	live.path = "live_set tracks " + track + " clip_slots " + next;
	live.call("fire");	
}
	

function observeTransport(args) {
	if (args[0] == "is_playing") {
		log("is_playing: ", args[1]);
		if (args[1] == 1) {
			playing = true;
			ready = true;
		}
		else {
			playing = false;
			ready = false;
		}
		seqPointer = 0;	

	}
}

function observeSlot(args) {
	if (args[0] == "playing_slot_index" && args[1] >= 0) {
		var current_slot = args[1];
		log("playing_slot_index: ", current_slot);
		
		this_clip.path = "live_set tracks " + track + " clip_slots " + current_slot + " clip";
		var length = this_clip.get("length");
		teenthsTillNextClip = length * 4;
		ready = true
	}
}

function log() {
  for(var i=0,len=arguments.length; i<len; i++) {
    var message = arguments[i];
    if(message && message.toString) {
      var s = message.toString();
      if(s.indexOf("[object ") >= 0) {
        s = JSON.stringify(message);
      }
      post(s);
    }
    else if(message === null) {
      post("<null>");
    }
    else {
      post(message);
    }
  }
  post("\n");
}