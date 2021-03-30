// Author: Chih-Yu Hsieh
// Email: jerryhs010878@gmail.com

// Credits:
// K means clustering algorithm in javascript from Xander Lewis:
// https://towardsdatascience.com/extracting-colours-from-an-image-using-k-means-clustering-9616348712be
// RawPixels prototype for reading image pixel informations from r-bin:
// https://community.adobe.com/t5/photoshop/get-index-of-each-pixel/td-p/10022899?page=1
// Array comparison function equals() by Tomáš Zato on Stack Overflow:
// https://stackoverflow.com/questions/7837456/how-to-compare-arrays-in-javascript

Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time 
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;       
        }           
        else if (this[i] != array[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;   
        }           
    }       
    return true;
}

function RawPixels(doc) {
    this.doc = doc;

    const currentActiveDoc = app.activeDocument;

    // Obtain the width and height in pixels of the desired document.
    const currentRulerUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;
    app.activeDocument = doc;
    this.width = Number(doc.width.value);
    this.height = Number(doc.height.value);
    this.length = this.width * this.height;
    this.pixelData = "";

    // Return the ruler to its previous state.
    app.preferences.rulerUnits = currentRulerUnits;

    try {
        // We're going to save this document as a raw bitmap to be able to read back in the pixel values
        // themselves.
        const file = new File(Folder.temp.fsName + "/" + Math.random().toString().substr(2) + ".raw");

        // Set up the save action.
        // See https://helpx.adobe.com/photoshop/using/file-formats.html#photoshop_raw_format for some info,
        // and more technical at https://www.adobe.com/devnet-apps/photoshop/fileformatashtml/
        var rawFormat = new ActionDescriptor();
        rawFormat.putString(stringIDToTypeID("fileCreator"), "8BIM");
        rawFormat.putBoolean(stringIDToTypeID("channelsInterleaved"), true);
        
        var saveAction = new ActionDescriptor();
        saveAction.putObject(stringIDToTypeID("as"), stringIDToTypeID("rawFormat"), rawFormat);
        saveAction.putPath(stringIDToTypeID("in"), file);
        saveAction.putBoolean(stringIDToTypeID("copy"), false);
        executeAction(stringIDToTypeID("save"), saveAction, DialogModes.NO);

        // File is saved; now read it back in as raw bytes.
        file.open("r");
        file.encoding = "BINARY";
        this.pixelData = file.read();

        const err = file.error;
        file.close();
        file.remove();
        file = null;
        if (err) alert(err);
    }
    catch (e) { alert(e); }

    // Return focus to whatever the user had.
    app.activeDocument = currentActiveDoc;
}

// Calculate offset from x, y coordinates. Does not check for valid bounds.
RawPixels.prototype.getOffset = function(x, y) {
    if (y == undefined) {
        // allow linear indices too
        y = Math.floor(x / this.width); 
        x = x - y * this.width;
    }
    return (y * this.width + x) * 3;
}

// Return an array of R, G, B pixel values for a particular coordinate.
RawPixels.prototype.get = function (x, y) {
    const off = this.getOffset(x, y);
    const R = this.pixelData.charCodeAt(off + 0);
    const G = this.pixelData.charCodeAt(off + 1);
    const B = this.pixelData.charCodeAt(off + 2);
    return [R, G, B];
}

function euclideanDistance(a, b) {
    var sum = 0
    for (var i = 0; i < a.length; i++) {
        sum += Math.pow(b[i] - a[i] , 2)
    }
    return Math.sqrt(sum);
}

function initializeCentroids(k, data){
	var centroids = []
	for (var i = 0; i < k; i++) {
		centroids.push(data[Math.floor(data.length * Math.random())])
	}
	return centroids
}

function clusterDataPoints(data, centroids) {
    var clusters = [];

    for (var i  = 0 ; i < centroids.length; i++) {
    	clusters.push([]);
    }

    for (var i  = 0 ; i < data.length; i++) {
    	var nearestCentroidIndex = 0
	    for(var j = 0; j < centroids.length; j++){
	    	if (euclideanDistance(data[i], centroids[j]) < euclideanDistance(data[i], centroids[nearestCentroidIndex])) {
	                nearestCentroidIndex = j;
	        }
	    }

	    clusters[nearestCentroidIndex].push(data[i]);
    }

    return clusters;
}

function getMean(cluster) {
	var sums = []
	var amount = cluster.length
	var dimensions = cluster[0].length

	for(var i = 0; i < dimensions; i++)
		sums.push(0)
	
	for(var i = 0; i < amount; i++) {
		for(var j = 0; j < dimensions; j++)
			sums[j] += cluster[i][j]
	}

	for(var i = 0; i < dimensions; i++) {
		sums[i] = sums[i] / amount
	}

	return sums
}

function updateCentroids(clusters) {
    var centroids = [];

    for (var i = 0 ; i < clusters.length; i++) {
    	centroids.push(getMean(clusters[i]))
    }

	return centroids;
}

function kMeans(pixels, k) {
	var centroids = initializeCentroids(k, pixels)
	var oldClusters
	var converged = false
	var iterationLimit = 50
	var iterations = 0

	while(!converged){
		iterations += 1
		var clusters = clusterDataPoints(pixels, centroids)
		if (clusters.equals(oldClusters) || iterations >= iterationLimit) {
            converged = true;
        }
        else {
        	// Add random point if a cluster is empty
        	for(var i = 0; i < clusters.length; i++){
        		if(clusters[i].length == 0)
        			clusters[i].push(pixels[Math.floor(pixels.length * Math.random())])
        	}

        	oldClusters = clusters
        	centroids = updateCentroids(clusters);
        }
	}

	for(var i = 0; i < k ; i++){
		for(var j = 0; j < centroids[i].length; j++) {
			centroids[i][j] = Math.round(centroids[i][j])
		}
	}

	return centroids
}

function selectLayerPixels() {
	var id710 = charIDToTypeID( "setd" );
	var desc168 = new ActionDescriptor();
	var id711 = charIDToTypeID( "null" );
	var ref128 = new ActionReference();
	var id712 = charIDToTypeID( "Chnl" );
	var id713 = charIDToTypeID( "fsel" );
	ref128.putProperty( id712, id713 );
	desc168.putReference( id711, ref128 );
	var id714 = charIDToTypeID( "T   " );
	var ref129 = new ActionReference();
	var id715 = charIDToTypeID( "Chnl" );
	var id716 = charIDToTypeID( "Chnl" );
	var id717 = charIDToTypeID( "Trsp" );
	ref129.putEnumerated( id715, id716, id717 );
	desc168.putReference( id714, ref129 );
	executeAction( id710, desc168, DialogModes.NO );
}

function main() {
    var doc = app.activeDocument
    try {
        var flatColorLayerSets = doc.layerSets.getByName('Flats')
    }
    catch(e) {
        alert("Can't find folder named \"Flats\". Please name your flat colors layer group \"Flats\" and try again." + "\n" + e.message)
        return;
    }

    var k = prompt("Enter the number of colors to extract.", 5);

    var referenceFolder = new Folder(Folder.selectDialog("Select folder with reference photos. Accepts \".jpg\" or \".jpeg\"."))
    var referenceFiles = referenceFolder.getFiles("*.jp*g")
    for (var a = 0; a < referenceFiles.length; a++) {

        var newReferenceDoc = app.open(referenceFiles[a])
        var shrinkSize = 75
        newReferenceDoc.resizeImage(UnitValue(shrinkSize,"px"),UnitValue(shrinkSize,"px"),null,ResampleMethod.BICUBIC);
        newReferenceDoc.resizeCanvas(UnitValue(shrinkSize,"px"),UnitValue(shrinkSize,"px"));

        var referenceRawPixel = new RawPixels(newReferenceDoc)
        var referencePixels = []
        for (var i = 0; i < referenceRawPixel.width; i++) {
            for (var j = 0; j < referenceRawPixel.height; j++) {
                referencePixels.push(referenceRawPixel.get(i, j))
            }
        }

        var extractedColors = kMeans(referencePixels, k)

        var extractedRGB = []
        for (var i = 0; i < extractedColors.length; i++) {
            var color = new RGBColor()
            color.red = extractedColors[i][0]
            color.green = extractedColors[i][1]
            color.blue = extractedColors[i][2]
            extractedRGB.push(color)
        }

        app.activeDocument = doc
        var flatColorLayers = flatColorLayerSets.duplicate().artLayers
        for(var i = 0; i < flatColorLayers.length; i++){
            if (flatColorLayers[i].blendMode == BlendMode.NORMAL && flatColorLayers[i].pixelsLocked == false) {
                doc.activeLayer = flatColorLayers[i]
                selectLayerPixels()
                
                doc.selection.fill(extractedRGB[i % k])
                doc.selection.deselect()
            }
        }

        newReferenceDoc.close(SaveOptions.DONOTSAVECHANGES)
    }   
};

main()
