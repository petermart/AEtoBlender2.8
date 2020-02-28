// G.node_index_motion_blur = 1
{  

/*------------------------*/    
function initGlobals(G)
/*------------------------*/ 
{
	G.RET = "\n"; 
//-------------------------------------------------------------------------------------------- About info    
	G.ABOUT = "AE2Blender28"				 										+ G.RET + G.RET +
				"Export the selected layers and cameras within"						+ G.RET +
				"the work area to a Blender 2.7 python script."						+ G.RET +
				"Run the generated script inside Blender to recreate the AE scene."	+ G.RET + G.RET +
 
				"Supported Layer Type Mappings:"									+ G.RET + 
				"    Camera -> Camera"												+ G.RET +
				"    Lights -> Lights"												+ G.RET +
				"    Solids -> Empties"												+ G.RET +
				"    Text -> Font"													+ G.RET + 
				"    Footage -> Rectangular Image Mapped Curve"						+ G.RET + G.RET +
				
				"by Atom"															+ G.RET + 
				"with coding help from..." 											+ G.RET + G.RET +
				
				"Nab (www.nabscripts.com)," 										+ G.RET +
				"Ryan Gilmore (www.urbanspaceman.net)"                              + G.RET +
                "and others on AE Enhancers (www.aenhancers.com) back in 2006."		+ G.RET + G.RET +

				"Updated for Blender by Peter Martin September 2019";
//---------------------------------------------------------------------------------------- Global Variables    
	G.APP_VERSION 			= parseFloat(app.version);
	G.FILE_FOLDER			= "~/Desktop";
	G.FILE_NAME				= "ae_to_blender27.py";
	G.FILE_PATH				= G.FILE_FOLDER + "/" + G.FILE_NAME;
	G.FILE_PATH_SET			= false;

	G.RADIOBUTTON_ON		= 1;
	
	G.WORLD_CENTER			= [0,0,0];
	G.WORLD_SCALE			= [1, 1, 1];   //was [1, 0.0254, 1]; Global-Flat-Mapping Size 0.5-Mapping Extension=Clip

	G.RATIO					= [0.8592, 0.9, 0.9481481, 1.0, 1.0186, 1.0667, 1.2, 1.333, 1.4222, 1.5, 1.8962962, 2];
	// [0]D2 NTSC, [1]D1 NTSC, [2]D4 Stan, [3]SQUARE, [4]D2 PAL, [5]D1 PAL, [6]D1 NTSC wide, [7]HDV, [8]D1 PAL wide, [9]DVCPROHD, [10]D4 Ana, [11]Ana2:1
	G.ORIGINAL_ASPECT		= 1;
	G.HEIGHT				= ""; // set dynamically
	G.WIDTH					= ""; // set dynamically
	G.MAYA_FB_H				= 1; 
	G.FPS_NAME				= ["ntsc", "pal", "film", "game", "show", "ntscf", "palf"];
	G.FPS					= 29.97;
	
	G.LAYER_TYPE			= "Layer";
	G.LAYER_IN				= 0.0;
	G.LIGHT_TYPE			= "N/A";
    G.LIGHT_DISTANCE        = 0.0;
	G.LIGHT_INTENSITY		= 0.0;
	G.LIGHT_COLOR			= [0,0,0,0];
    G.LIGHT_CONE_ANGLE      = 45.0;
    G.LIGHT_CONE_FEATHER    = 0.0;
    G.LIGHT_CAST_SHADOWS    = false;
    G.LIGHT_SHADOW_DIFFUSION = 36.0;
	G.LAYER_TEXT			= "N/A";
	G.LAYER_TEXT_COLOR		= [0,0,0,0];
	G.LAYER_FILENAME		= "N/A";
	G.LAYER_MASKS			= []
	G.FILENAME_WIDTH		= 0.0;
	G.FILENAME_HEIGHT		= 0.0;
    G.FILENAME_PIXEL_ASPECT  = 1.0;
	G.MASK_SCALE			= 100.0;	//Used to scale After Effects numbers into Blender number space for masks.
	G.APPLY_TRACKTO			= false;
	G.CAMERA_NAME			= "Camera";
    G.CAMERA_ZOOM           = 54.34;
	G.LAYER_WAS_2D			= false;
	G.LAYER_IS_ANIMATED		= [false, false, false, false, false, false, false, false, false, false];
	G.LAYER_ORIG_NAMES		= [];
	G.LAYER_NAMES			= [];
	G.LAYER_NAME_MATCH		= false;
	G.LAYER_NAME_TOO_LONG 	= false;
    G.LAYER_MOTION_BLUR     = false;
    G.LAYER_SOURCE_NAME		= ""; // set dynamically
	G.LAYER_NAME			= ""; // set dynamically
	G.SHORT_LAYER_NAME 	 	= ""; // set dynamically
	G.SCENE_STRING			= ""; // set dynamically
	G.LAYER_KEYS_STRING 	= ""; // set dynamically
//--------------------------------------------------------------------------------------------- Alert messages
	G.SAFE_DUR			= 180; // 3 minutes
	G.SAFE_DUR_WNG 		= "Warning. The composition work area exceeds " + G.SAFE_DUR + " seconds. Do you want to continue ?";      
}

/*------------------------*/    
function initUI(UI)
/*------------------------*/
{
	if (app.project.file != null)
	{
		fullProjectName=File.decode(app.project.file.name);
		projectName=fullProjectName.substring(0,fullProjectName.lastIndexOf("."));
		G.FILE_NAME = projectName + ".py";
		G.FILE_PATH = G.FILE_FOLDER + "/" + G.FILE_NAME;
	}
	
	UIunit=10;
	UIwidth=275;
	UIheight=UIunit*28;
	
//------------------------------------------------------------------------------------- main interface draw

	UI.main = new Window('palette', '', [0,0,UIwidth,UIheight]);
	
	UI.main.name=UI.main.add('statictext', [UIunit,UIunit*1.5,UIwidth-(UIunit*17),UIunit*3], "AE 2 Blender");
	UI.main.optionsButton=UI.main.add('button', [UIwidth-(UIunit*16)-5,UIunit-2,UIwidth-(UIunit*9),UIunit*3+2], "Options");
	UI.main.aboutButton=UI.main.add('button', [UIwidth-(UIunit*8),UIunit-2,UIwidth-UIunit,UIunit*3+2], "About");
	UI.main.add('panel' ,[UIunit,UIunit*4,UIwidth-UIunit,UIunit*4+4], "");
	
//Export to
	UI.main.add('statictext' ,[UIunit*2+2,UIunit*5+5,UIwidth-UIunit,UIunit*7], "Export to:");
    UI.main.BL=UI.main.add('radiobutton', [UIwidth/3-UIunit,UIunit*7+5,UIwidth*(2/3)-(UIunit*2),UIunit*10], "Blender 2.8");
	UI.main.BL.value=true;
	
//Save as
	UI.main.add('statictext', [UIunit*2+2,UIunit*12,UIwidth-UIunit,UIunit*14-5], "Save As:");
	UI.main.fileName=UI.main.add('edittext', [UIunit*2,UIunit*14+8,UIwidth-(UIunit*10),UIunit*16+8], G.FILE_NAME);
	UI.main.browseButton=UI.main.add('button', [UIwidth-(UIunit*9),UIunit*14+5,UIwidth-(UIunit*2),UIunit*17], "Browse");
	UI.main.add('panel' ,[UIunit,UIunit*11,UIwidth-UIunit,UIunit*11+1], "");
	UI.main.add('panel' ,[UIunit,UIunit*11,UIunit+1,UIunit*18], "");
	UI.main.add('panel' ,[UIunit,UIunit*18,UIwidth-UIunit,UIunit*18+1], "");
	UI.main.add('panel' ,[UIwidth-UIunit,UIunit*11,UIwidth-UIunit+1,UIunit*18], "");

//Export button
	UI.main.exportButton=UI.main.add('button', [UIunit,UIunit*19+5,UIwidth-UIunit,UIunit*22+5], "Export");

//progress
	UI.main.progress=UI.main.add('statictext', [UIunit*2+2,UIunit*25-2,UIwidth-(UIunit*3),UIunit*26+5], "");
	UI.main.progress.text="Ready.";
	UI.main.add('panel' ,[UIunit,UIunit*24,UIwidth-UIunit,UIunit*24+1], "");
	UI.main.add('panel' ,[UIunit,UIunit*24,UIunit+1,UIunit*27], "");
	UI.main.add('panel' ,[UIunit,UIunit*27,UIwidth-UIunit,UIunit*27+1], "");
	UI.main.add('panel' ,[UIwidth-UIunit,UIunit*24,UIwidth-UIunit+1,UIunit*27], "");
	
//------------------------------------------------------------------------------------- options interface draw

	UI.options = new Window('palette', '', [0,0,UIwidth,UIunit*23]); 
	
	UI.options.name=UI.options.add('statictext', [UIunit,UIunit*1.5,UIwidth-(UIunit*8),UIunit*3], "AE Blender EXPORT : Options");
	
//Shift Center
	UI.options.add('panel' ,[UIunit,UIunit*4,UIwidth-UIunit,UIunit*4+1], "");
	UI.options.add('panel' ,[UIunit,UIunit*4,UIunit+1,UIunit*7+5], "");
	UI.options.originShift=UI.options.add('checkbox', [UIunit*2,UIunit*5,UIwidth-(UIunit*3),UIunit*6+5], "shift the comp center to 0,0,0");
	UI.options.originShift.value = true;
	UI.options.add('panel' ,[UIwidth-UIunit,UIunit*4,UIwidth-UIunit+1,UIunit*7+7], "");
	UI.options.add('panel' ,[UIunit,UIunit*7+5,UIwidth-UIunit,UIunit*7+6], "");
	
//Scale scene
	UI.options.scaleSlider = UI.options.add('scrollbar', [UIunit,UIunit*12,UIwidth-UIunit,UIunit*13+5], 0, -4, 4);
	UI.options.scaleSlider.value = -2;
	UI.options.sliderValDisplay = UI.options.add('statictext', [UIunit*2+2,UIunit*9,UIwidth-UIunit,UIunit*10+5], "");
	UI.options.sliderValDisplay.text = "world scale set at 1 : " + Math.pow(10, UI.options.scaleSlider.value);

//Close button
	UI.options.closeButton=UI.options.add('button', [UIwidth-(UIunit*8),UIunit*19+5,UIwidth-UIunit,UIunit*22], "Close");


//------------------------------------------------------------------------------ user interface functionality
	UI.main.center();
	UI.main.show();

//About button
	UI.main.aboutButton.onClick = function()
	{
		UI.main.progress.text="Ready.";
		alert(G.ABOUT);
	}
	
//Options button
	UI.main.optionsButton.onClick = function()
	{
		UI.main.progress.text="Ready.";
		UI.options.center();
		UI.main.visible = false;
		UI.options.show();
		
	}

//radio buttons
	UI.main.BL.onClick = function ()
	{
		UI.main.progress.text="Ready.";
		G.FILE_NAME = G.FILE_NAME.substring(0,G.FILE_NAME.lastIndexOf(".")) + ".py";
		UI.main.fileName.text = G.FILE_NAME;
		G.RADIOBUTTON_ON = 1;
		G.FILE_PATH = G.FILE_FOLDER + "/" + G.FILE_NAME;
	}
	
//Save As box
	UI.main.fileName.onChange = function ()
	{
		UI.main.progress.text="Ready.";
		G.FILE_NAME = UI.main.fileName.text
		G.FILE_NAME = addSuffixIfMissing(G.FILE_NAME);
		UI.main.fileName.text = G.FILE_NAME;
		G.FILE_PATH = G.FILE_FOLDER + "/" + G.FILE_NAME;
	}	
	
//"Browse" button for saving file
	UI.main.browseButton.onClick = function ()
	{
		UI.main.progress.text="Ready.";
		G.FILE_PATH = File.openDialog ("Save the exported file as...");	//CS5.
		//G.FILE_PATH = File.openDialog ("Save the exported file as...", UI.main.fileName.text, "");	//CS5.
		//G.FILE_PATH = filePutDialog ("Save the exported file as...", UI.main.fileName.text, "");	//CS3.
		if (G.FILE_PATH != null) // if user entered new info, update the path
		{
			G.FILE_FOLDER = G.FILE_PATH.path;
			G.FILE_NAME = G.FILE_PATH.name;
			G.FILE_NAME = addSuffixIfMissing(G.FILE_NAME);
			G.FILE_PATH = G.FILE_FOLDER + "/" + G.FILE_NAME;
			UI.main.fileName.text = G.FILE_NAME;
			G.FILE_PATH_SET = true;
		}
		else // if user presses cancel
		{
			G.FILE_PATH = G.FILE_FOLDER + "/" + G.FILE_NAME;
		}
	}
	
//Export button
	
	UI.main.exportButton.onClick = function ()
	{
		UI.main.progress.text="Ready.";
		G.FILE_NAME = UI.main.fileName.text;
		if (File(G.FILE_PATH).exists == true && G.FILE_PATH_SET == false)
		{
			var overwrite = confirm("Overwrite item named \"" + File(G.FILE_PATH).name + "\" ?");
			if (overwrite==true) 
			{	
				UI.main.progress.text="Processing...";
				UI.main.hide();
				UI.main.show();
				main();
			}
			else // user said no, don't overwrite
			{
				return
			}
		}
		else
		{	
			UI.main.progress.text="Processing...";
			G.FILE_PATH_SET = false;
			UI.main.hide();
			UI.main.show();
			main();
		}
	}
	
//Options window
	UI.options.onClose = function()
	{
		UI.main.visible = true;
	}
//Origin shift check box
	UI.options.originShift.onClick = function ()
	{
		UI.main.progress.text="Ready.";
	}	

//Scale Slider
	UI.options.scaleSlider.onChange = function ()
	{
		UI.main.progress.text="Ready.";
		UI.options.scaleSlider.value = Math.round(UI.options.scaleSlider.value);
		UI.options.sliderValDisplay.text = "world scale set at 1 : " + Math.pow(10, UI.options.scaleSlider.value);
		
	}	
//Options Close button
	UI.options.closeButton.onClick = function ()
	{
		UI.main.progress.text="Ready.";
		UI.options.close();
		UI.main.visible = true;
	}
	
}	

/*---------------------------------------------------------------------------------------------------------    
 SUBROUTINES
---------------------------------------------------------------------------------------------------------*/

/*-------------------------------------*/
function radiansToDegrees(r) 
/*-------------------------------------*/
{
	return r * (180 / Math.PI);
}

/*---------------------------------------*/
function degreesToRadians(d) 
/*----------------------------------------*/
{
	return d * ( Math.PI / 180 );
}
    
/*-----------------------------------------------------*/
function removeForbiddenCharacters(str) 
/*-----------------------------------------------------*/
{
	FirstChar=str.charAt(0);
	if (FirstChar>"0" && FirstChar<"9") {str="L" + str};
	return str.replace(/[^a-zA-Z0-9]+/g,""); 
}

/*------------------------------------------*/
function addSuffixIfMissing (Str)
/*-------------------------------------------*/
{
	if (Str.indexOf(".") == -1)
	{
		var suffix = "";
        suffix=".py"
		Str = Str + suffix;
	}
	return (Str);
}

/*-----------------------------------------*/   
function storeOriginalLayerNames (selLayers)
/*-----------------------------------------*/
{
	for (var i=0; i<selLayers.length; i++)
	{
		var layer = selLayers[i];
		G.LAYER_ORIG_NAMES[i] = layer.name;
	}
}
/*----------------------------------------*/   
function checkForBadLayerNames (selLayers)
/*----------------------------------------*/
{
	// shorten long names
	for (var i=0; i<selLayers.length; i++)
	{
		var layer = selLayers[i];
		if (layer.name.length > 15)
		{
			layer.name = layer.name.substring(0,15);
			G.LAYER_NAME_TOO_LONG = true;
		}
	}
	// get rid of duplicate names
	var NumMatches = 0;
	for (var i=0; i<selLayers.length; i++) 
	{
		var layer = selLayers[i];
		G.LAYER_NAMES[i] = layer.name;
	}
	for (var i=0; i<selLayers.length; i++) 
	{
		var heroLayer = G.LAYER_NAMES[i];
		for (j=0;j<selLayers.length;j++)
		{
			if (heroLayer == G.LAYER_NAMES[j]) {NumMatches += 1}
		}
	}
	if (NumMatches > selLayers.length)
	{
		G.LAYER_NAME_MATCH = true;
		for (var i=0; i<selLayers.length; i++) 
		{
			selLayers[i].name = selLayers[i].name + "CC" + (i+1);
		}
	}
}

/*-----------------------------------*/   
function restoreLayerNames (selLayers)
/*-----------------------------------*/
{
	if (G.LAYER_NAME_MATCH == true || G.LAYER_NAME_TOO_LONG == true)
	{
		for (var i=0; i<selLayers.length; i++) 
		{
			selLayers[i].name = G.LAYER_ORIG_NAMES[i] ;
		}
	}
}

/*-----------------------------*/    
function getTotalFrames(comp)
/*-----------------------------*/    
{
	return (comp.workAreaDuration / comp.frameDuration);   
}

/*----------------------------------------*/    
function getFrameAspect()
/*----------------------------------------*/    
{
	return (Math.round(G.WIDTH * G.ORIGINAL_ASPECT)) / G.HEIGHT;
}

/*-------------------------------*/    
function getPreciseCompPAR(comp)
/*-------------------------------*/    
{
	var compPAR;
	switch (comp.pixelAspect) 
	{
		case 0.86:
			compPAR = G.RATIO[0];
			break;
		case 0.9:
			compPAR = G.RATIO[1];
			break;            
		case 0.95:
			compPAR = G.RATIO[2];
			break;
		case 1.0:
			compPAR = G.RATIO[3];
			break;
		case 1.02:
			compPAR = G.RATIO[4];
			break;
		case 1.07:
			compPAR = G.RATIO[5];
			break;
		case 1.2:
			compPAR = G.RATIO[6];
			break;
		case 1.33:
			compPAR = G.RATIO[7];
			break;
		case 1.42:
			compPAR = G.RATIO[8];
			break;
		case 1.5:
			compPAR = G.RATIO[9];
			break;
		case 1.9:
			compPAR = G.RATIO[10];
			break;
		case 2:
			compPAR = G.RATIO[11];
			break;
		default:
			compPAR = comp.pixelAspect;
		break;
	}
	return compPAR
}

/*----------------------------*/    
function getFPSName(comp)
/*----------------------------*/    
{
	var fpsName;
	switch (comp.frameRate)
	{
		case 30:
			fpsName = G.FPS_NAME[0];
			break;
		case 25:
			fpsName = G.FPS_NAME[1];
			break;
		case 24:
			fpsName = G.FPS_NAME[2];
			break;
		case 15:
			fpsName = G.FPS_NAME[3];
			break;
		case 48:
			fpsName = G.FPS_NAME[4];
			break;
		case 60:
			fpsName = G.FPS_NAME[5];
			break;
		case 50:
			fpsName = G.FPS_NAME[6];
			break;
		default:
			fpsName = G.FPS_NAME[0];
			break;
	}
	return fpsName;
}

/*-------------------------------------------------*/
function getFLenOrFOVorZFacFromZoom(comp, zoomVal)
/*-------------------------------------------------*/
{
	var compPAR = getPreciseCompPAR(comp);
	var frameAspect = getFrameAspect(); 
	var hFOV = Math.atan((0.5 * comp.width * compPAR) / zoomVal);
	return 2 * radiansToDegrees(hFOV);
}

/*-------------------------------------------------*/
function nonSquareToSquare (comp)
/*-------------------------------------------------*/
{
	if (G.ORIGINAL_ASPECT != 1)
	{
		var WorldCenterNull = comp.layers.addNull(comp.duration);
		WorldCenterNull.name = "WorldCenter";
		WorldCenterNull.startTime = 0;
		for (i=2;i<=comp.numLayers;i++)
		{
			if (comp.layer(i).parent == null)
			{
				comp.layer(i).parent = WorldCenterNull;
			}
		}
		var squareWidth = Math.round( G.WIDTH * G.ORIGINAL_ASPECT );
		comp.width = squareWidth;
		comp.pixelAspect = 1;
		WorldCenterNull.position.setValue([squareWidth/2, comp.height/2]);
	}
}

/*-------------------------------------------------*/
function squareToNonSquare (comp)
/*-------------------------------------------------*/
{
	if (G.ORIGINAL_ASPECT != 1)
	{
		comp.layer("WorldCenter").position.setValue([G.WIDTH/2, comp.height/2]);
		comp.pixelAspect = G.ORIGINAL_ASPECT;
		comp.width = G.WIDTH;
		comp.layer("WorldCenter").remove();
	}
}
function getWidthHeightOfFootageItem (passedName)
{
   l = passedName.length
   for (i = 1; i <= app.project.numItems; ++i)
        if (app.project.item(i).typeName == "Footage")
        {
            possibleName = app.project.item(i).name.substring(0,l)
            if(possibleName == passedName)
            {
                //Save the width and height of this footage item.
                G.FILENAME_WIDTH = app.project.item(i).width
                G.FILENAME_HEIGHT = app.project.item(i).height
                G.FILENAME_PIXEL_ASPECT = app.project.item(i).pixelAspect
            }
        }
}

function pythonDIR (passedValue)
{
    //Javascript version of python DIR.
    result = [];
    for (attr in passedValue)
    {
        result.push(attr);
    }
    result.sort();
    return result
}

function getMasksOnLayer(layer)
{
	//G.SCENE_STRING += "# Scanning layer for masks..." + G.RET;
	var selectedMaskShapes = new Array();     
	// Scan for selected masks
	var masksGroup = layer("Masks");
	if (masksGroup != null)
	{  
		// We have a mask.
		// Iterate through properties of masksGroup
		for (var i = 1; i <= masksGroup.numProperties; i++)
		{
			//G.SCENE_STRING += "# Mask detected #" + i + G.RET;
			var current_mask = masksGroup.property(i);
			selectedMaskShapes[selectedMaskShapes.length]=  new Object();
			selectedMaskShapes[selectedMaskShapes.length-1].pos=current_mask.property("maskShape");
			selectedMaskShapes[selectedMaskShapes.length-1].layer=layer;
			/*
			if (masksGroup.property(i).selected)
			{
				// Append selected mask to the array
			}
			*/
		}
	}
	else
	{
		//G.SCENE_STRING += "# No mask detected." + G.RET;
	}
	if (layer.constructor.name=="ShapeLayer")
	{
		//We have a shape layer
		var selectedProps = layer.selectedProperties;
		for (var i = 0;  i< selectedProps.length; i++) 
		{
			var prop = selectedProps[i];
			if (prop.constructor.name == "Property") 
			{ 
				// Ok, we have a property and not a property group 
				if(prop.propertyValueType==PropertyValueType.SHAPE)
				{
					selectedMaskShapes[selectedMaskShapes.length]=  new Object();
					selectedMaskShapes[selectedMaskShapes.length-1].pos=prop;
					selectedMaskShapes[selectedMaskShapes.length-1].layer=layer;	
				}
			}
		}
	}
	return selectedMaskShapes;
}
function outputAnimatedMaskPoints(points, frame)
{		
	for(var j=0;j<points.vertices.length;j++)
	{
		G.SCENE_STRING += "p = BezTriple.New(" + points.vertices[j][1]/G.MASK_SCALE + ", " + points.vertices[j][0]/G.MASK_SCALE + ", 0)" + G.RET;
		// Default tangent types to AUTO.
		inTan = "AUTO";
		outTan = "AUTO";
		if (points.inTangents[j][0] == 0) {
			if (points.inTangents[j][1] == 0) {
				if (points.outTangents[j][0] == 0) {
					if (points.outTangents[j][1] == 0) {
						// If the tangents are all zero, then this is a free point.
						inTan = "FREE";
						outTan = "FREE";
					}
				}
			}
		}
		G.SCENE_STRING += "p.handleTypes = [" + inTan + ", " + outTan + "]" +
		"	# In(" + points.inTangents[j][0] + ", " + points.inTangents[j][1] +")  -  Out("+ points.outTangents[j][0] + ", " + points.outTangents[j][1] +")" + G.RET;
		G.SCENE_STRING += "c[0][" + j + "] = p" + G.RET + G.RET;
	}
	G.SCENE_STRING += ""+
	"Blender.Set('curframe', " + frame +")				# Move to frame #"+ frame +G.RET +
	"cObj.insertShapeKey()						# Add a shape key for this mask shape." + G.RET;
}
function outputMaskPoints(points, frame)
{		
	for(var j=0;j<points.vertices.length;j++)
	{
		G.SCENE_STRING += "p = BezTriple.New(" + points.vertices[j][1]/G.MASK_SCALE + ", " + points.vertices[j][0]/G.MASK_SCALE + ", 0)" + G.RET;
		// Default tangent types to AUTO.
		inTan = "AUTO";
		outTan = "AUTO";
		if (points.inTangents[j][0] == 0) {
			if (points.inTangents[j][1] == 0) {
				if (points.outTangents[j][0] == 0) {
					if (points.outTangents[j][1] == 0) {
						// If the tangents are all zero, then this is a free point.
						inTan = "FREE";
						outTan = "FREE";
					}
				}
			}
		}
		G.SCENE_STRING += "p.handleTypes = [" + inTan + ", " + outTan + "]" +
		"	# In(" + points.inTangents[j][0] + ", " + points.inTangents[j][1] +")  -  Out("+ points.outTangents[j][0] + ", " + points.outTangents[j][1] +")" + G.RET;
		if (j == 0){
			G.SCENE_STRING += "curve = c.appendNurb(p)" + G.RET + G.RET;
		}
		else {
			G.SCENE_STRING += "curve.append(p)" + G.RET + G.RET;
		}
	}
	if (frame != undefined)
	{
		// A frame number was passed, let's set a shape key.
		G.SCENE_STRING += ""+
		"Blender.Set('curframe', " + frame +")				# Move to frame #"+ frame+G.RET +
		"cObj.insertShapeKey()					# Add the first shape key for the basis shape." + G.RET + G.RET;
	}
}

function outputMaskData (passedMaskShapes)
{
	for(var i=0; i<passedMaskShapes.length;i++)
	{
		G.SCENE_STRING += "# Data for mask #" + i + G.RET +
		"c = Curve.New()             	# create new  curve data" + G.RET +
		"cObj = Object.New('Curve')    	# make curve object" + G.RET +
		"cObj.name = '"+ G.SHORT_LAYER_NAME +"_curve'"+ G.RET +
		"cObj.link(c)                  	# link curve data with this object" + G.RET +
		"localScene.link(cObj)         	# link object into scene" + G.RET + G.RET;

		var myShape = passedMaskShapes[i].pos;
		var numKeys = myShape.numKeys;
		if (numKeys > 0){
			for (var k = 1; k <= myShape.numKeys; k++)
			{
				if (k==1){
					var curTime = parseInt(myShape.keyTime(k)*G.FPS); 
					var points= passedMaskShapes[i].pos.valueAtTime(curTime,false);
					G.SCENE_STRING += "# -->Creating basis shape at frame #" + curTime + G.RET;
					outputMaskPoints(points, curTime)			// First shape is a little diferent output.
				}
				else{
					
					var curTime = parseInt(myShape.keyTime(k)*G.FPS); 
					var points= passedMaskShapes[i].pos.valueAtTime(curTime,false);
					G.SCENE_STRING += "# -->Animating curve points for frame #" + curTime + G.RET;
					outputAnimatedMaskPoints(points,curTime)	// Rest of the shapes simply modify the points of the first.
				}
			}
			//G.SCENE_STRING += "c.update()";
		}
		else{	
			//alert("Non-animated mask.")
			var points = passedMaskShapes[i].pos.value;
			outputMaskPoints(points)
		}
		G.SCENE_STRING += "" +
		"curve.flagU = 1								# Set curve to cyclic."+ G.RET +
		"c.update()"+ G.RET +
		"localObj.makeParent([cObj])" + G.RET + G.RET;
	}
}

/*-------------------------------------------------*/
function checkLayerType(layer)
/*-------------------------------------------------*/
{
	switch(layer.matchName)
	{
		case "ADBE Camera Layer":
			G.LAYER_TYPE="Camera";

            var frameAspect = getFrameAspect(); 
            var hFOV = Math.atan((0.5 * G.WIDTH * G.ORIGINAL_ASPECT) / layer.property("Zoom").value);
			G.CAMERA_ZOOM = 2 * radiansToDegrees(hFOV);

	
			break;
		case "ADBE Light Layer":
			// For now I'm not sure how to detect the After Effects light type, so all lights will appear as spots.
			G.LIGHT_TYPE = "Sun";
			G.LAYER_TYPE="Light";
			if (layer.property("Cone Angle") != null) {G.LIGHT_TYPE = "Spot";}
			G.LIGHT_INTENSITY = layer.property("Intensity").value
            G.LIGHT_COLOR = layer.property("Color").value
            
			G.LIGHT_CONE_ANGLE = degreesToRadians(layer.property("Cone Angle").value)   // Blender Cone Angle is in radians.
            
            G.LIGHT_CONE_FEATHER = layer.property("Cone Feather").value
            
            //G.LIGHT_CAST_SHADOWS = layer.property("Cast Shadows").value
            
            G.LIGHT_SHADOW_DIFFUSION = layer.property("Shadow Diffusion").value
            
            G.LIGHT_DISTANCE = Math.abs(layer.property("Position").value[2]-layer.property("Point of Interest").value[2])

            /*
            for (i = 1; i<layer.numProperties; i++)
            {
                temp = temp + "" + layer.property(i).name
            }
            */
            //temp = pythonDIR(layer.property("Cone Angle"))
            //alert()
            
            //alert(G.LIGHT_COLOR[0] + ", " +G.LIGHT_COLOR[1] +"," +G.LIGHT_COLOR[2] )
			break;
		case "ADBE Text Layer":
			G.LAYER_TYPE="Text";
			G.LAYER_TEXT = layer.property("Source Text").value.toString();
			
			//Replace chacters that will generate python errors on execution inside Blender.
			l = G.LAYER_TEXT.length
			var tempString = "";
			for (i = 0; i<l; i++)
			{
				switch (G.LAYER_TEXT.charCodeAt(i))
				{
					case 13:
						//Replace these characters.
						tempString = tempString + "<BR>";
						break;
					default:
						tempString = tempString + G.LAYER_TEXT.charAt(i);
				}
			}
			G.LAYER_TEXT = tempString
			if (layer.threeDLayer == false) 
			{
				layer.threeDLayer = true;
				G.LAYER_WAS_2D = true;
			}
			var theValue = layer.property("sourceText").value;
			G.LAYER_TEXT_COLOR = theValue.fillColor
			//temp = pythonDIR(layer.Effects("ADBE Fill").property(7).value)
			//temp = pythonDIR(layer.property("color").value)
			//temp = pythonDIR(layer.Effects.name)
			//temp = layer.Effects("ADBE Fill").property("color").value
			//alert(temp)
            //out = pythonDIR(theValue)
			//alert(theValue.fillColor)
			break;
		case "ADBE AV Layer":
			//This type can be a NULL, Adjustment, Solid or Footage layer.
			try{
				// If the layer has an absoluteURI, it is footage else we end up in the catch.
				//http://jongware.mit.edu/idcs5/pc_Folder.html
				//fsName	string 	readonly	The platform-specific name of the referenced folder as a full path name.
				// For now full path filenames are delimited by the @ symbol.
				// When the python script is run, it will decode the filename.
				// If you change this symbol you have to change it in both places, here and the python generated returnMATFootage.
				G.LAYER_FILENAME = layer.source.file.fsName.replace(/\\/g, '@')
				if (layer.autoOrient == AutoOrientType.CAMERA_OR_POINT_OF_INTEREST)
				{
					// This layer should have a trackTo modifier applied to it so it always faces the camera.
					G.APPLY_TRACKTO	 = true;
				}
				G.LAYER_TYPE="Footage";
			}
			catch(err){
				G.LAYER_TYPE="Layer";
			}

			if (layer.threeDLayer == false) 
			{
				layer.threeDLayer = true;
				G.LAYER_WAS_2D = true;
			}
			break;
		case "ADBE Vector Layer":
			G.LAYER_TYPE="Vector";
			break;
		default:
			G.LAYER_TYPE="Layer";
	}
	
	//Save this layers inpoint.
	G.LAYER_IN = layer.inPoint;
	
	// See if the layer has any masks.
	G.LAYER_MASKS = getMasksOnLayer(layer)
}

/*------------------------*/
function DataContainer()
/*------------------------*/
{
	var data = new Object();

	data.xpos   = ""; // Maya and Blender, one parameter at a time
	data.ypos   = ""; 
	data.zpos   = ""; 
	data.xscal  = "";
	data.yscal  = ""; 
	data.zscal  = "";
	data.xrot   = ""; 
	data.yrot   = ""; 
	data.zrot   = "";
	
	data.flen   = ""; 
 
	data.keys   = ""; // Max, all paramerters one frame at a time

	return data;
}

/*--------------------------------------------------------------------------------------------*/
function collectValueAtCurrentTime_XYZ_Camera (comp, layerCopy, layerCopyParent, t)
/*--------------------------------------------------------------------------------------------*/
{
	//alert(pythonDIR(layerCopyParent.anchorPoint));
	var temp_xpoi  = layerCopyParent.anchorPoint.valueAtTime(t, false)[0];
	var temp_ypoi  = layerCopyParent.anchorPoint.valueAtTime(t, false)[1];
	var temp_zpoi  = layerCopyParent.anchorPoint.valueAtTime(t, false)[2];
	var temp_xpos  = layerCopyParent.position.valueAtTime(t, false)[0];
	var temp_ypos  = layerCopyParent.position.valueAtTime(t, false)[1];
	var temp_zpos  = layerCopyParent.position.valueAtTime(t, false)[2];
	var temp_xscal = 100;
	var temp_yscal = 100;
	var temp_zscal = 100;
	var temp_xrot  = layerCopy.rotationX.valueAtTime(t, false);
    var temp_yrot  = layerCopy.orientation.valueAtTime(t, false)[1];
	var temp_zrot  = layerCopy.rotationZ.valueAtTime(t, false);
	var temp_flen  = getFLenOrFOVorZFacFromZoom(comp, layerCopy.zoom.valueAtTime(t, false) / (layerCopyParent.scale.valueAtTime(t, false)[0]/100) );
	return [temp_xpos, temp_ypos, temp_zpos, temp_xscal, temp_yscal, temp_zscal, temp_xrot, temp_yrot, temp_zrot, temp_flen,temp_xpoi,temp_ypoi,temp_zpoi];
}
/*--------------------------------------------------------------------------------------------*/
function collectValueAtCurrentTime_XYZ_Layer (comp, layerCopy, layerCopyParent, t)
/*--------------------------------------------------------------------------------------------*/
{
	//alert(layerCopyParent.anchorPoint);

	var temp_xpivot  = layerCopyParent.anchorPoint.valueAtTime(t, false)[0];
	var temp_ypivot  = layerCopyParent.anchorPoint.valueAtTime(t, false)[1];
	var temp_zpivot  = layerCopyParent.anchorPoint.valueAtTime(t, false)[2];
	var temp_xpos  = layerCopyParent.position.valueAtTime(t, false)[0];
	var temp_ypos  = layerCopyParent.position.valueAtTime(t, false)[1];
	var temp_zpos  = layerCopyParent.position.valueAtTime(t, false)[2];
	var temp_xscal = layerCopy.scale.valueAtTime(t, false)[0];
	var temp_yscal = layerCopy.scale.valueAtTime(t, false)[1];
	var temp_zscal = layerCopy.scale.valueAtTime(t, false)[2];
	var temp_xrot  = layerCopy.rotationX.valueAtTime(t, false);
    var temp_yrot  = layerCopy.orientation.valueAtTime(t, false)[1];
	var temp_zrot  = layerCopyParent.rotationZ.valueAtTime(t, false);
	var temp_flen  = "";
	return [temp_xpos, temp_ypos, temp_zpos, temp_xscal, temp_yscal, temp_zscal, temp_xrot, temp_yrot, temp_zrot, temp_flen,temp_xpivot,temp_ypivot,temp_zpivot];
}

/*-----------------------------------------------------------------------------------------------------------*/
function storeValueAtCurrentTime_Blender (passedName, comp, data, frameCounter, layerState, worldScale, t)
/*-----------------------------------------------------------------------------------------------------------*/
{
	var matrixLine 	= "";
	var positionLine 	= "";
	var scaleLine 		= "";
	var rotationLine 	= "";
	var curTime= frameCounter;
	var amIAnimated = false;
	
	//See if I am animated, this affects what data we spit out (hawk too!)
	if (G.LAYER_IS_ANIMATED[0] ==true) {amIAnimated = true}
	if (G.LAYER_IS_ANIMATED[1] ==true) {amIAnimated = true}
	if (G.LAYER_IS_ANIMATED[2] ==true) {amIAnimated = true}
	if (G.LAYER_IS_ANIMATED[3] ==true) {amIAnimated = true}
	if (G.LAYER_IS_ANIMATED[4] ==true) {amIAnimated = true}
	if (G.LAYER_IS_ANIMATED[5] ==true) {amIAnimated = true}
	if (G.LAYER_IS_ANIMATED[6] ==true) {amIAnimated = true}
	if (G.LAYER_IS_ANIMATED[7] ==true) {amIAnimated = true}
	if (G.LAYER_IS_ANIMATED[8] ==true) {amIAnimated = true}
	
	// If animated, set the current frame we are on before we assign LOCROT values to the object.
	if (amIAnimated == true)
    {
        positionLine = "localScene.frame_current = " + frameCounter + G.RET;
    }
    // Store the After Effects transform data in a generic python list of vectors. LOC/ROT/SCALE.
	x = layerState[0]- G.WIDTH/2;
	y = layerState[1]- G.HEIGHT/2;
	x_pivot = layerState[10];	//- G.WIDTH/2;	// For cameras, this value is point-of-interest.
	y_pivot = layerState[11];	//- G.HEIGHT/2;
	values = "v=[[" + x + "," + y + "," + layerState[2] + ", 1], [" + layerState[6] + "," + layerState[7] + "," + layerState[8] + ",0], [" + layerState[3]/100.0 + "," + layerState[4]/100.0 + "," + layerState[5]/100.0 + ",0],[" + x_pivot + "," + y_pivot + "," + layerState[12] + ", 1]]" + G.RET;
	values += "applyTransform(v, localObj)" + G.RET;
	
	//If animated, insert a keyframe, if not animated and frame #1 only output the LOCROT information for the object.
	if (amIAnimated == true)
	{
		data.keys += values;
		data.keys += "localObj.keyframe_insert(data_path='location', frame=(" + frameCounter + "))" + G.RET;
		data.keys += "localObj.keyframe_insert(data_path='rotation_euler', frame=(" + frameCounter + "))" + G.RET;
		data.keys += "localObj.keyframe_insert(data_path='scale', frame=(" + frameCounter + "))" + G.RET + G.RET;
        //data.keys += "bpy.ops.anim.keyframe_insert(type='LocRotScale',confirm_success=False)" + G.RET;
	}
	else
	{
		if (frameCounter == 1)
		{
			data.keys += values;
			//data.keys += positionLine	+ rotationLine + G.RET;
		}
		else
		{
			data.key += "# Perhaps we need some data output here?" + G.RET;
		}
	}
}

/*--------------------------------------------------------------------------------------------*/
function checkChannelsForAnimation(layer)
/*--------------------------------------------------------------------------------------------*/
{
	if (G.LAYER_TYPE == "Camera")
	{
		if (layer.position.isTimeVarying == true) {G.LAYER_IS_ANIMATED[0] = true;G.LAYER_IS_ANIMATED[1] = true;G.LAYER_IS_ANIMATED[2] = true;};
		if (layer.orientation.isTimeVarying == true) {G.LAYER_IS_ANIMATED[6] = true;G.LAYER_IS_ANIMATED[7] = true;G.LAYER_IS_ANIMATED[8] = true;};
		if (layer.rotationX.isTimeVarying == true) {G.LAYER_IS_ANIMATED[6] = true;G.LAYER_IS_ANIMATED[7] = true;G.LAYER_IS_ANIMATED[8] = true;};
		if (layer.rotationY.isTimeVarying == true) {G.LAYER_IS_ANIMATED[6] = true;G.LAYER_IS_ANIMATED[7] = true;G.LAYER_IS_ANIMATED[8] = true;};
		if (layer.rotationZ.isTimeVarying == true) {G.LAYER_IS_ANIMATED[6] = true;G.LAYER_IS_ANIMATED[7] = true;G.LAYER_IS_ANIMATED[8] = true;};
		if (layer.zoom.isTimeVarying == true) {G.LAYER_IS_ANIMATED[9] = true;};
        
		/*
		//This code seems to give a false true for cameras that are not animated.
		if (layer.pointOfInterest != null) 
		{
			G.LAYER_IS_ANIMATED[6] = true; G.LAYER_IS_ANIMATED[7] = true; G.LAYER_IS_ANIMATED[8] = true;
		}
		*/
	}
	else if (G.LAYER_TYPE == "Light")
	{
		if (layer.position != null)
		{
			if (layer.position.isTimeVarying == true) {G.LAYER_IS_ANIMATED[0] = true;G.LAYER_IS_ANIMATED[1] = true;G.LAYER_IS_ANIMATED[2] = true;};
		}
		if (layer.orientation != null)
		{
			if (layer.orientation.isTimeVarying == true) {G.LAYER_IS_ANIMATED[6] = true;G.LAYER_IS_ANIMATED[7] = true;G.LAYER_IS_ANIMATED[8] = true;};
			if (layer.rotationX.isTimeVarying == true) {G.LAYER_IS_ANIMATED[6] = true;G.LAYER_IS_ANIMATED[7] = true;G.LAYER_IS_ANIMATED[8] = true;};
			if (layer.rotationY.isTimeVarying == true) {G.LAYER_IS_ANIMATED[6] = true;G.LAYER_IS_ANIMATED[7] = true;G.LAYER_IS_ANIMATED[8] = true;};
			if (layer.rotationZ.isTimeVarying == true) {G.LAYER_IS_ANIMATED[6] = true;G.LAYER_IS_ANIMATED[7] = true;G.LAYER_IS_ANIMATED[8] = true;};
		}
		/*
		//This code seems to give a false true for lights that are not animated.
		if (layer.pointOfInterest != null) 
		{
			alert("POI");
			G.LAYER_IS_ANIMATED[6] = true; G.LAYER_IS_ANIMATED[7] = true; G.LAYER_IS_ANIMATED[8] = true;
		}
		*/
	}
	else if (G.LAYER_TYPE == "Layer" || G.LAYER_TYPE == "Text")
	{
		//temp = pythonDIR(layer.scale)
		//alert(layer.scale.value, layer.scale.valueAtTime(0, false))
		//alert(temp)
		if (layer.position.isTimeVarying == true) {G.LAYER_IS_ANIMATED[0] = true;G.LAYER_IS_ANIMATED[1] = true;G.LAYER_IS_ANIMATED[2] = true;};
		if (layer.scale.isTimeVarying == true) {G.LAYER_IS_ANIMATED[3] = true;G.LAYER_IS_ANIMATED[4] = true;G.LAYER_IS_ANIMATED[5] = true;};
		if (layer.orientation.isTimeVarying == true) {G.LAYER_IS_ANIMATED[6] = true;G.LAYER_IS_ANIMATED[7] = true;G.LAYER_IS_ANIMATED[8] = true;};
		if (layer.rotationX.isTimeVarying == true) {G.LAYER_IS_ANIMATED[6] = true;G.LAYER_IS_ANIMATED[7] = true;G.LAYER_IS_ANIMATED[8] = true;};
		if (layer.rotationY.isTimeVarying == true) {G.LAYER_IS_ANIMATED[6] = true;G.LAYER_IS_ANIMATED[7] = true;G.LAYER_IS_ANIMATED[8] = true;};
		if (layer.rotationZ.isTimeVarying == true) {G.LAYER_IS_ANIMATED[6] = true;G.LAYER_IS_ANIMATED[7] = true;G.LAYER_IS_ANIMATED[8] = true;};
		
	}
    if (G.LAYER_TYPE == "Text")
    {
        if (layer.name == "mt_BG")
        {
            temp = layer.Effects("Particular")
            alert(temp)
        }
    }
    if (G.LAYER_TYPE == "Text")
    {
        //temp = pythonDIR(layer.Effects("ADBE Fill").property(7).value)
        //temp = pythonDIR(layer.property("color").value)
		//temp = pythonDIR(layer.Effects.name)
        //temp = layer.Effects("ADBE Fill").property("color").value
        //alert(temp)
    }
}

/*--------------------------------------------------------------------------------------------*/
function AssumeLayerIsAnimated(layer)
/*--------------------------------------------------------------------------------------------*/
{
	if (layer.parent.name == "WorldCenter") // doesn't count if the parent is this, so consider it unparented
	{
		checkChannelsForAnimation(layer);
	}
	else // since its parented, assume all layers are animated
	{
		for (var j=0;j<=9;j++)
		{
			G.LAYER_IS_ANIMATED[j] = true;
		}
	}
}

/*--------------------------------------------------------------------------------------------*/
function checkForAnimation(layer)
/*--------------------------------------------------------------------------------------------*/
{
	if (layer.parent != null) // if it has a parent
	{
		AssumeLayerIsAnimated(layer);
	}
	else
	{
		checkChannelsForAnimation(layer);
	}
}

/*--------------------------------------------------------------------------------------------*/
function resetComposition (comp, layer)
/*--------------------------------------------------------------------------------------------*/
{
	for (var m=0;m<=9;m++)
	{
		G.LAYER_IS_ANIMATED[m] = false;
	}
	if (G.LAYER_WAS_2D == true)
	{
		layer.threeDLayer = false;
		G.LAYER_WAS_2D = false;
	}
	comp.layer(G.SHORT_LAYER_NAME + "_copy").remove(); 			// remove the cooked layer
	comp.layer(G.SHORT_LAYER_NAME + "_copy_parent").remove(); 	// remove the cooked layer"s parent
}

/*--------------------------------------------------------------------------------------------*/
function totalFramesByChannel(totalFrames)
/*--------------------------------------------------------------------------------------------*/
{
	var totalFramesArray = [];
	for (var n=0;n<=9;n++)
	{
		if (G.LAYER_IS_ANIMATED[n] == false) {totalFramesArray[n] = 1}else{totalFramesArray[n] = totalFrames};
	}
	return totalFramesArray;
}

/*--------------------------------------------------------------------------------------------*/
function getData(comp, data) // grabs the data of each frame and stores it in a set of strings
/*--------------------------------------------------------------------------------------------*/
{
	var worldScale 				= G.WORLD_SCALE[G.RADIOBUTTON_ON-1] * ( Math.pow(10, UI.options.scaleSlider.value) );
	var layerCopyParent 		= comp.layer(G.SHORT_LAYER_NAME + "_copy_parent");
	var layerCopy 				= comp.layer(G.SHORT_LAYER_NAME + "_copy");
	var totalFrames 			= getTotalFrames(comp);
 	var frameCounter 			= 1;

// origin shift

 	if (UI.options.originShift.value == true)
 	{
 		G.WORLD_CENTER = [comp.width/2,comp.height/2,0];
	}
	else
	{
		G.WORLD_CENTER = [0,0,0];
	}
	
// warning   

	if (comp.workAreaDuration > G.SAFE_DUR)
	{
		if (!confirm(G.SAFE_DUR_WNG, true, "AE2Blender27"))
       {
			return false;
		}
	}

// process layer

	if (G.RADIOBUTTON_ON == 1) // Blender
	{
		switch(G.LAYER_TYPE) {
			case "Camera":
				for (var t = comp.workAreaStart; t < comp.workAreaStart + comp.workAreaDuration; t += comp.frameDuration)
				{
					clearOutput();
					UI.main.progress.text="Processing \"" + G.LAYER_NAME + "\" : " + Math.round(((frameCounter/totalFrames)*100)-1) + " %";
					var layerState = collectValueAtCurrentTime_XYZ_Camera (comp, layerCopy, layerCopyParent, t);
                    //G.CAMERA_ZOOM = layerState[9];
					storeValueAtCurrentTime_Blender (G.SHORT_LAYER_NAME, comp, data, frameCounter, layerState, worldScale, t);
					frameCounter++;
				}
				break;
			case "Footage":
			default:
				for (var t = comp.workAreaStart; t < comp.workAreaStart + comp.workAreaDuration; t += comp.frameDuration)
				{
					clearOutput();
					UI.main.progress.text="Processing \"" + G.LAYER_NAME + "\" : " + Math.round(((frameCounter/totalFrames)*100)-1) + " %";
					var layerState = collectValueAtCurrentTime_XYZ_Layer (comp, layerCopy, layerCopyParent, t);
					storeValueAtCurrentTime_Blender (G.SHORT_LAYER_NAME, comp, data, frameCounter, layerState, worldScale, t);
					frameCounter++;
				}
		}	
	}
	clearOutput();
}

/*-----------------------------------------------------------------------------------*/    
function writeHeader(comp)
/*-----------------------------------------------------------------------------------*/ 
{
	var worldScale 			= 	G.WORLD_SCALE[G.RADIOBUTTON_ON-1] * ( Math.pow(10, UI.options.scaleSlider.value) );
	var totalFrames 		=   getTotalFrames(comp);
	var frameAspect 		=   getFrameAspect(); 
	var fpsName     		=   getFPSName(comp);
	var mayaFB      		=   frameAspect * G.MAYA_FB_H; 
	
	if (G.RADIOBUTTON_ON == 1) // Blender
	{
		fps_value = G.FPS
		tmp_fps = G.FPS
		if((typeof(tmp_fps)=='number') && (tmp_fps.toString().indexOf('.')==-1)) {
			// This is an integer so Blender fps_value should be 1.0.
			fps_divisor = 1.0;
		} else {
			// This is a float so we need to offset the FPS by 1.001.
			fps_divisor = 1.001;
			// Special fixup for common FPS, customs may fail here, add you own as needed.
			if (G.FPS > 23.97) fps_value = 24
			if (G.FPS > 29.96) fps_value = 30
			if (G.FPS > 59.93) fps_value = 60
		}
		G.SCENE_STRING ="# Generated by Atom's After Effects Exporter To Blender 2.80a. Updated from 2.7 By Peter Martin" + G. RET +
						"# Run this script, inside a Blender text window, to re-create the After Effects file [" + G.FILE_NAME + "] as a Blender scene. "+ G. RET + G.RET +
                        "# TIP: To locate the begining of a layer, do a Find on \"Make a\"" + G.RET + G.RET +
                        "import bpy" + G.RET +
                        "import os, math" + G.RET +
                        "from mathutils import Vector, Matrix, Euler" + G.RET +
						"" + G.RET +
                        "def createEmpty(passedName=\"\"):" + G.RET +
                        "    try:" + G.RET +
                        "        ob = bpy.data.objects.new(passedName, None)" + G.RET +
                        "        localScene = bpy.data.scenes[0]" + G.RET +
                        "        localScene.collection.objects.link(ob)" + G.RET +
                        "    except:" + G.RET +
                        "        ob = None" + G.RET +
                        "    return ob" + G.RET + G.RET +
                        "def returnPlaneMesh(passedMeshName,scaleWidth, scaleHeight):" + G.RET +
                        "    vp_points = []" + G.RET +
                        "    vp_faces = []" + G.RET +
                        "    vp_objects = []" + G.RET +
                        "    vp_D1 = Vector([-0.5*scaleWidth, -0.5*scaleHeight, 0.0])" + G.RET +
                        "    vp_D2 = Vector([0.5*scaleWidth, -0.5*scaleHeight, 0.0])" + G.RET +
                        "    vp_D3 = Vector([0.5*scaleWidth, 0.5*scaleHeight, 0.0])" + G.RET +
                        "    vp_D4 = Vector([-0.5*scaleWidth, 0.5*scaleHeight, 0.0])" + G.RET +
                        "    c = 0" + G.RET +
                        "" + G.RET +
                        "    # 1 - unit plane object at world origin." + G.RET +
                        "    dd = Vector([0.0,0.0,0.0])" + G.RET +
                        "    vp_points.append(dd+vp_D1)" + G.RET +
                        "    vp_points.append(dd+vp_D2)" + G.RET +
                        "    vp_points.append(dd+vp_D3)" + G.RET +
                        "    vp_points.append(dd+vp_D4)" + G.RET +
                        "    vp_faces.append([c,c+1,c+2,c+3])" + G.RET +
                        "" + G.RET +
                        "    me = bpy.data.meshes.new(passedMeshName)" + G.RET +
                        "    me.from_pydata(vp_points,[],vp_faces)" + G.RET +
                        "" + G.RET +
                        "    # Make sure all verts are deselected." + G.RET +
                        "    for v in me.vertices:" + G.RET +
                        "        v.select = False" + G.RET +
                        "    me.update()" + G.RET +
                        "    return me" + G.RET +
						"" + G.RET +
                        "def makePlaneCurve (passedOBName, passedCUName,scaleWidth,scaleHeight):" + G.RET +
                        "    cu_plane = bpy.data.curves.new(passedCUName,'CURVE')" + G.RET +
                        "    cu_plane.dimensions = '2D'" + G.RET +
                        "    cu_plane.extrude = 0.01" + G.RET +
                        "    spline = cu_plane.splines.new('BEZIER')" + G.RET +
                        "    spline.use_cyclic_u = True" + G.RET +
                        "    spline.bezier_points.add(3)" + G.RET +
                        "    ob_plane = bpy.data.objects.new(passedOBName,cu_plane)" + G.RET +
                        "    bpy.data.scenes[0].collections.objects.link(ob_plane)" + G.RET +
                        "    " + G.RET +
                        "    #Let's create 4 points in this curve to make a rectangle." + G.RET +
                        "    for n in range(4):" + G.RET +
                        "        p = spline.bezier_points[n]" + G.RET +
                        "        if n == 0:myLocation = Vector([-0.5*scaleWidth, -0.5*scaleHeight, 0.0])" + G.RET +
                        "        if n == 1:myLocation = Vector([0.5*scaleWidth, -0.5*scaleHeight, 0.0])" + G.RET +
                        "        if n == 2:myLocation = Vector([0.5*scaleWidth, 0.5*scaleHeight, 0.0])" + G.RET +
                        "        if n == 3:myLocation = Vector([-0.5*scaleWidth, 0.5*scaleHeight, 0.0])" + G.RET +
                        "        p.co = myLocation" + G.RET +
                        "        p.handle_right_type='VECTOR'" + G.RET +
                        "        p.handle_left_type='VECTOR'" + G.RET +
                        "    return ob_plane" + G.RET +
                        "def returnMaterialByName(passedName):" + G.RET +
                        "    result = None" + G.RET +
                        "    for m in bpy.data.materials:" + G.RET +
                        "        if m.name == passedName:" + G.RET +
                        "            result = m" + G.RET +
                        "            break" + G.RET +
                        "    return result" + G.RET +
                        "" + G.RET +
                        "def createNewMaterial (passedName,passedRGB):" + G.RET +
                        "    tempMat = bpy.data.materials.new(passedName)" + G.RET +
                        "    if tempMat != None:" + G.RET +

                        "        tempMat.diffuse_color = (passedRGB[0],passedRGB[1],passedRGB[2],1)" + G.RET +
                        "        tempMat.specular_color = (0.9,0.9,0.9)" + G.RET +
                        "        tempMat.specular_intensity = 0.0" + G.RET +
                        "    return tempMat" + G.RET +
                        "" + G.RET +
						"def acquireOrCreateMaterial(passedName,passedRGB):" + G.RET +
						"	tempMat = returnMaterialByName(passedName)" + G.RET +
						"	if tempMat == None:" + G.RET +
						"		tempMat = createNewMaterial(passedName,passedRGB)" + G.RET +
						"	tempMat.diffuse_color = (passedRGB[0],passedRGB[1],passedRGB[2],1)" + G.RET +
						"	return tempMat" + G.RET +
                        "" + G.RET +
                        "def assignMaterial(passedObjectName, passedMaterialName, passedLink = \"DATA\"):" + G.RET +
                        "    result = False" + G.RET +
                        "    tempMaterial = returnMaterialByName(passedMaterialName)" + G.RET +
                        "    if tempMaterial != None:" + G.RET +
                        "        tempObject = bpy.data.objects.get(passedObjectName)" + G.RET +
                        "        if tempObject != None:" + G.RET +
                        "            if tempObject.material_slots.__len__() > 0:" + G.RET +        
                        "                tempObject.material_slots[0].material = tempMaterial" + G.RET +
                        "                tempObject.material_slots[0].link = passedLink" + G.RET +
                        "            else:" + G.RET +
                        "                obSave = bpy.context.object" + G.RET +
                        "                bpy.context.view_layer.objects.active  = tempObject" + G.RET +
                        "                bpy.context.view_layer.objects.active  = obSave" + G.RET +
                        "            result = True" + G.RET +
                        "        else:" + G.RET +
                        "            print(\"No object called [\" + passedObjectName + \"].\")" + G.RET +
                        "    else:" + G.RET +
                        "        print(\"No material called [\" + passedMaterialName + \"].\")" + G.RET +
                        "    return result" + G.RET +
                        "" + G.RET +
						"def returnMATFootage (passedMaterialName, passedFootageFileName, passedUVLayerName):" + G.RET +
						"	tex = bpy.data.textures.new('texture', type = 'IMAGE')              # Create a new image type texture." + G.RET +
						"	mat = acquireOrCreateMaterial(passedMaterialName,[1.0,0.0,0.0])     # Get a material named like the passedMaterialName." + G.RET +
						"	s = passedFootageFileName.replace('@',os.sep)                       # @ symbols are used a folder delimiters, replace them now." + G.RET +
						"	realpath = os.path.expanduser(s)" + G.RET +
						"	if os.path.exists(realpath) == True:" + G.RET +
						"		# File seems to exists, let's load the image or footage." + G.RET +
						"		try:" + G.RET +
						"			footage = bpy.data.images.load(realpath)" + G.RET +
						"		except:" + G.RET +
						"			footage = None" + G.RET +
						"		if footage != None:" + G.RET +
						"			tex.image = footage" + G.RET +
						"			#footage.use_premultiply = True" + G.RET +
						"			tex.image_user.use_auto_refresh = True" + G.RET +
						"			tex.image_user.frame_duration = 24000" + G.RET +
						"			# ts = mat.texture_slots.add()                                    # Currently not working: Add a new texture slot." + G.RET +
						"			# ts.texture = tex                                                # Assign our new texture to the slot." + G.RET +
						"			# ts.texture_coords = 'ORCO'" + G.RET +
						"			print(\"Footage [\" + realpath + \"] found and loaded!\")" + G.RET +
						"			mat.diffuse_color = (0.0,1.0,0.0,1)   # All good = GREEN." + G.RET +
						"		else:" + G.RET +
						"			# Footage exists, but is unloadable." + G.RET +
						"			mat.diffuse_color = (0.0,0.0,1.0,1)   # Unloadable = BLUE" + G.RET +
						"			print(\"Footage [\" + realpath + \"] unloadable by Blender 2.70a.\")" + G.RET +
						"	else:" + G.RET +
						"		mat.diffuse_color = (1.0,0.0,0.0,1)   # File not found = RED" + G.RET +
						"		print(\"Unable to locate footage [\" + realpath + \"].\")" + G.RET +
						"" + G.RET +
						"	return mat" + G.RET +
						"" + G.RET +
						"def translateScale(sca):" + G.RET +
						"	mat = Matrix()  # 4x4 default" + G.RET +
						"	mat[0][0] = sca[0]" + G.RET +
						"	mat[1][1] = sca[1]" + G.RET +
						"	mat[2][2] = sca[2]" + G.RET +
						"	return mat" + G.RET +
						"" + G.RET +
						"def returnMatrixFromLRS(loc,rot,scale):" + G.RET +
						"	# Where input is 3 values as a vector?" + G.RET +
						"	loc_mtx = None" + G.RET +
						"	rot_mtx = None" + G.RET +
						"	scale_mtx = None" + G.RET +
						"	if loc:" + G.RET +
						"		loc_mtx = Matrix.Translation(loc)" + G.RET +
						"	if rot:" + G.RET +
						"		eul = Euler((math.radians(-rot[0]), math.radians(rot[1]), math.radians(rot[2])), 'XYZ')" + G.RET +
						"		rot_mtx = eul.to_matrix().to_4x4()" + G.RET +
						"	if scale:" + G.RET +
						"		scale_mtx = translateScale(scale)" + G.RET +
						"	new_mat = Matrix()" + G.RET +
						"	mats = [loc_mtx,rot_mtx,scale_mtx]" + G.RET +
						"	for mtx in mats:" + G.RET +
						"		if mtx:" + G.RET +
						"			new_mat = new_mat @ mtx" + G.RET +
						"	return new_mat" + G.RET +
						"" + G.RET +
						"def applyTransform(listLOCROTSCALE, passedOb):" + G.RET +
						"	if passedOb != None:" + G.RET +
						"		mtx = returnMatrixFromLRS(Vector(listLOCROTSCALE[0]),Vector(listLOCROTSCALE[1]),Vector(listLOCROTSCALE[2]))" + G.RET +
						"		mtx.transpose()                                             # From BL Stack user." + G.RET +
						"		rot_x_neg90 = Matrix.Rotation(math.pi/2.0, 4, 'X')          # From Kastoria." + G.RET +
						"		passedOb.matrix_world = rot_x_neg90 @ mtx                   # From Kastoria." + G.RET +
						"		passedOb.location = [mtx[3][0]/100,mtx[3][2]/100,-mtx[3][1]/100]        # Flip Z and Y axis." + G.RET +
                        "" + G.RET + G.RET + 
                        "# Setup the scene animation range, fps and render size." + G.RET +
                        "localScene= bpy.data.scenes[0]" + G.RET +
                        "#localScene.render.use_color_management = False"+ G.RET +
                        "localScene.frame_start = 1"+ G.RET +
                        "localScene.frame_end = " + totalFrames + G.RET +
                        "localScene.render.fps =" + fps_value + G.RET +
						"localScene.render.fps_base =" + fps_divisor + G.RET +
                        "localScene.render.resolution_x = " + comp.width + G.RET +
                        "localScene.render.resolution_y = " + comp.height + G.RET +
                        "localScene.render.resolution_percentage = 100" + G.RET + G.RET +
                        "";
	}
}

/*-----------------------------------------------------------------------------------*/    
function writeThisLayerIntoScene(comp, data)
/*-----------------------------------------------------------------------------------*/ 
{
	var totalFrames 		= getTotalFrames(comp);
	var totalFramesBC		= totalFramesByChannel(totalFrames);
	var frameAspect 		= getFrameAspect(); 
	var fpsName     		= getFPSName(comp);
	var mayaFB      		= frameAspect * G.MAYA_FB_H;
	
	if (G.RADIOBUTTON_ON == 1) // Blender
	{
		switch (G.LAYER_TYPE)
		{
			case "Camera":
				G.CAMERA_NAME = G.SHORT_LAYER_NAME;		// Save the camera name in case we have to trackTo it later.
				G.SCENE_STRING += 	G.RET+
				"# Make a camera."+G.RET+
                "ca = bpy.data.cameras.new('ca_" + G.SHORT_LAYER_NAME+"')" + G.RET +
                "ca.angle = math.radians(" + G.CAMERA_ZOOM + ")" + G.RET +
                "ca.lens_unit = 'FOV'" + G.RET +
                "localObj = bpy.data.objects.new('" + G.SHORT_LAYER_NAME + "',ca)" + G.RET +
                "localScene.collection.objects.link(localObj)" + G.RET +
				G.RET+"# " + G.SHORT_LAYER_NAME +" keyframe data..." + G.RET+
				data.keys + G.RET ;
				break;
			case "Light":
				G.SCENE_STRING +=	G.RET+
				"# Make a light."+G.RET+
                "la = bpy.data.lamps.new('la_" + G.SHORT_LAYER_NAME+"','SPOT')" + G.RET +
				"la.color = [" + G.LIGHT_COLOR[0] + ","+G.LIGHT_COLOR[1]+ "," + G.LIGHT_COLOR[2] +"]" + G.RET +
				"la.distance = " + (G.LIGHT_DISTANCE/100.0) + G.RET +
                "la.falloff_type = 'LINEAR_QUADRATIC_WEIGHTED'" + G.RET +
				"la.energy = " + (G.LIGHT_INTENSITY/100.0)*2.0 + G.RET +
                "la.spot_size = " + G.LIGHT_CONE_ANGLE + G.RET +
                "la.spot_blend = " + (G.LIGHT_CONE_FEATHER/100.0) + G.RET +
                "localObj = bpy.data.objects.new('" + G.SHORT_LAYER_NAME + "',la)" + G.RET +
                "localScene.collection.objects.link(localObj)" + G.RET +
				"localObj.show_name = True" + G.RET+
				G.RET+"# " + G.SHORT_LAYER_NAME +" keyframe data..." + G.RET+
				data.keys + G.RET ;
				break;
			case "Text":
				// Might as well create a true 3D text object for our user.
				G.SCENE_STRING += 	G.RET+
				"# Make a 3D text object." + G.RET +
                "localTextObject = bpy.data.curves.new('txt_" + G.SHORT_LAYER_NAME+"','FONT')" + G.RET +
                "# Newline characters are replaced with <BR>. Edit as needed." + G.RET +
				"myTextValue = \"" + G.LAYER_TEXT + "\"" + G.RET +
                "localTextObject.body = myTextValue" + G.RET +
                "localTextObject.extrude = 0.02" + G.RET +
                "localTextObject.bevel_depth = 0.01" + G.RET +
                "localTextObject.bevel_resolution = 3" + G.RET +
                "localTextObject.size = 1.0" + G.RET +
                "localObj = bpy.data.objects.new('" + G.SHORT_LAYER_NAME +"',localTextObject)" + G.RET +
                "localScene.collection.objects.link(localObj)" + G.RET + 
				"mat = acquireOrCreateMaterial('mat_" + G.SHORT_LAYER_NAME +"', [" + G.LAYER_TEXT_COLOR[0] + ","+G.LAYER_TEXT_COLOR[1]+ "," + G.LAYER_TEXT_COLOR[2] +"])" + G.RET +
				"assignMaterial('" + G.SHORT_LAYER_NAME +"','mat_" + G.SHORT_LAYER_NAME +"')" + G.RET;
                if (G.LAYER_MOTION_BLUR == true){G.SCENE_STRING +="localObj.pass_index = 1"+ G.RET;}
				G.SCENE_STRING += "# " + G.SHORT_LAYER_NAME +" keyframe data..." + G.RET +
				data.keys + G.RET;
				break;
			case "Footage":
				//We detected footage, so let's create a plane and map the footage as a material.
				G.SCENE_STRING += G.RET+
				"# Make a 3D image mapped, curve based plane object, with footage assigned." + G.RET +
                "localObj = makePlaneCurve('"+ G.SHORT_LAYER_NAME +"','cu_" + G.SHORT_LAYER_NAME +"'," + (G.FILENAME_WIDTH*G.FILENAME_PIXEL_ASPECT)/100.0 +"," + (G.FILENAME_HEIGHT/100.0) +")" + G.RET +
                "mat = returnMATFootage('mat_" + G.SHORT_LAYER_NAME +"','" + G.LAYER_FILENAME +"','uv_" + G.SHORT_LAYER_NAME +"')" + G.RET +   
                "assignMaterial('" + G.SHORT_LAYER_NAME +"','mat_" + G.SHORT_LAYER_NAME +"')" + G.RET +
                "o={'active_object': localObj, 'object': localObj, 'window': bpy.context.window, 'region': bpy.context.region, 'scene': localScene}" + G.RET+
				"bpy.ops.curve.match_texture_space(o)" + G.RET;
                if (G.LAYER_MOTION_BLUR == true){G.SCENE_STRING += "localObj.pass_index = 1"+ G.RET;}
				G.SCENE_STRING += "# " + G.SHORT_LAYER_NAME +" keyframe data..." + G.RET+
				data.keys + G.RET;
				break;
			default:
				//All other layer type result in an EMPTY being generated.
				G.SCENE_STRING +=	G.RET+
				"# Make an empty."+G.RET+
				"localObj = createEmpty('" + G.SHORT_LAYER_NAME +"')"+G.RET+
				G.RET+"# " + G.SHORT_LAYER_NAME +" keyframe data..." + G.RET+
				data.keys + G.RET;
		}
		outputMaskData (G.LAYER_MASKS)
	}
}

/*-----------------------------------------------------------------------------------*/    
function writeFooter(comp)
/*-----------------------------------------------------------------------------------*/ 
{
	var totalFrames 		=   getTotalFrames(comp);
	var frameAspect 		=   getFrameAspect(); 
	
	if (G.RADIOBUTTON_ON == 1) // Blender
	{
		G.SCENE_STRING += 	"print (\"Atom's After Effects to Blender 2.8 project converter! (Converted from 2.7 to 2.8 by Peter Martin)\")" + G.RET +
							"# End conversion of After Effects file[" + G.FILE_NAME + "]." + G.RET;
	}
}

/*-----------------------------------------------------------------------------------*/    
function write3DFile() // writes an ASCII file that the 3D softwave can read
/*-----------------------------------------------------------------------------------*/    
{      
	var file = File(G.FILE_PATH);	
	if (!file)
	{
		return;
	}
	if (file.open("w", "TEXT", "????"))
	{                   
		file.writeln(G.SCENE_STRING);
		file.close();
	}
}
/*-----------------------------------------------------------------------------------*/    
function writeFile(passedName,passedItem) // writes an ASCII file that the 3D softwave can read
/*-----------------------------------------------------------------------------------*/    
{      
	var file = File(passedName);	
	if (!file)
	{
		return;
	}
	if (file.open("w", "TEXT", "????"))
	{                   
		file.writeln(passedItem);
		file.close();
	}
}
/*----------------------------------------------------------------------------------------------------------------*/    
function cookLayer(comp, layer) // create a copy of the layer in After Effects and prepare the transformation data
/*----------------------------------------------------------------------------------------------------------------*/    
{
    //temp = pythonDIR(layer)
    //alert(temp)
    
    if (layer.hasVideo == true)
    {
        //alert("Has Video")
        try{
            G.LAYER_SOURCE_NAME = layer.source.name;
        }
        catch(err)
        {
            G.LAYER_SOURCE_NAME = "ERROR";
        }
    }

    G.LAYER_MOTION_BLUR = layer.motionBlur;
	G.LAYER_NAME = layer.name;
	G.SHORT_LAYER_NAME = removeForbiddenCharacters (layer.name);

// make a copy of the layer
	if (G.LAYER_TYPE == "Camera")
	{
		var layerCopy = comp.layers.addCamera(G.SHORT_LAYER_NAME + "_copy",[0,0]);
		layerCopy.startTime = 0;
		layerCopy.pointOfInterest.expression = "position;";
		layerCopy.position.setValue([comp.width/2,comp.height/2,0]);
	}
	else // light, layer or text.
	{
		var layerCopy = comp.layers.addNull();
		layerCopy.name = G.SHORT_LAYER_NAME + "_copy";
		layerCopy.startTime = 0;
		layerCopy.threeDLayer = true;
		layerCopy.anchorPoint.setValue([50,50,0]);
		layerCopy.position.setValue([comp.width/2,comp.height/2,0]);
	}
	
// make a parent for the layer copy (used for position, for scaling if camera, for Z rotation if rotation is being reversed)
	var layerCopyParent = comp.layers.addNull();
	layerCopyParent.name = G.SHORT_LAYER_NAME + "_copy_parent";
	layerCopyParent.startTime = 0;
	layerCopyParent.threeDLayer = true;
	layerCopyParent.anchorPoint.setValue([50,50,0]);
	layerCopyParent.position.setValue([comp.width/2,comp.height/2,0]);
	layerCopy.parent = layerCopyParent; // attach layer copy to parent

// Expression blocks

	var layerRefExp 	= "L = thisComp.layer(\"" + G.LAYER_NAME + "\");"		+ G.RET;
	
	var unitMatrixExp 	= "c=L.toWorldVec([0,0,0]);"							+ G.RET +
						"u=L.toWorldVec([unit[0],0,0]);"						+ G.RET +
						"v=L.toWorldVec([0,unit[1],0]);"						+ G.RET +
						"w=L.toWorldVec([0,0,unit[2]]);"						+ G.RET;	

	var posExp 			= 	"L.toWorld(A)";
								
	var scaleExp 		= "[1/length(c, u),1/length(c, v),1/length(c, w)]*100";
					  
	
	var ZYXrotExp 		= "hLock=clamp(u[2],-1,1);"					+ G.RET +
						"h=Math.asin(-hLock);"						+ G.RET +
						"cosH=Math.cos(h);"							+ G.RET +
						"if (Math.abs(cosH) > 0.0005){"				+ G.RET +
						"  p=Math.atan2(v[2], w[2]);"				+ G.RET +
						"  b=Math.atan2(u[1],u[0]);"				+ G.RET +
						"}else{"									+ G.RET +
						"  b=Math.atan2(w[1], v[1]);"				+ G.RET +
						" p=0;"										+ G.RET +
						"}"											+ G.RET;
	
	var YXZrotExp 		= "pLock=clamp(w[1],-1,1);"					+ G.RET +
						"p=Math.asin(-pLock);"						+ G.RET +
						"cosP=Math.cos(p);"							+ G.RET +
						"if (Math.abs(cosP) > 0.0005){"				+ G.RET +
						"  h=Math.atan2(w[0], w[2]);"				+ G.RET +
						"  b=Math.atan2(u[1],v[1]);"				+ G.RET +
						"}else{"									+ G.RET +
						"  h=Math.atan2(u[2], w[2]);"				+ G.RET +
						"  b=0;"									+ G.RET +
						"}"											+ G.RET;
							
	var zoomExp			= "L.zoom";
	
// write expressions into the layer copy and its parent
	if (G.RADIOBUTTON_ON==1) // for Blender (YXZ rotation)
	{
		if (G.LAYER_TYPE == "Camera")
		{
			layerCopyParent.position.expression 	= layerRefExp + "A=[0,0,0];" + G.RET + posExp;
			layerCopyParent.scale.expression 		= layerRefExp + "unit=[1,1,1];" + G.RET + unitMatrixExp + scaleExp;
			layerCopy.orientation.expression 		= layerRefExp + "unit=thisLayer.parent.scale/100;" + G.RET + unitMatrixExp + YXZrotExp + "[ 0, radiansToDegrees(h), 0 ]";
			layerCopy.rotationX.expression 			= layerRefExp + "unit=thisLayer.parent.scale/100;" + G.RET + unitMatrixExp + YXZrotExp + "radiansToDegrees(p)";
			layerCopy.rotation.expression 			= layerRefExp + "unit=thisLayer.parent.scale/100;" + G.RET + unitMatrixExp + YXZrotExp + "radiansToDegrees(b)";
			layerCopy.zoom.expression 				= layerRefExp + zoomExp;
		}
		else if (G.LAYER_TYPE == "Light")
		{
			layerCopyParent.position.expression 	= layerRefExp + "A=[0,0,0];" + G.RET + posExp;
			layerCopy.scale.expression 				= layerRefExp + "unit=[1,1,1];" + G.RET + unitMatrixExp + scaleExp;
			layerCopy.orientation.expression 		= layerRefExp + "unit=scale/100;" + G.RET + unitMatrixExp + YXZrotExp + "[ 0, radiansToDegrees(h), 0 ]";
			layerCopy.rotationX.expression 			= layerRefExp + "unit=scale/100;" + G.RET + unitMatrixExp + YXZrotExp + "radiansToDegrees(p)";
			layerCopy.rotation.expression 			= layerRefExp + "unit=scale/100;" + G.RET + unitMatrixExp + YXZrotExp + "radiansToDegrees(b)";
		}
		else	// if (G.LAYER_TYPE == "Layer" || G.LAYER_TYPE == "Text")
		{
			layerCopyParent.position.expression 	= layerRefExp + "A=L.anchorPoint;" + G.RET + posExp;
			layerCopy.scale.expression 				= layerRefExp + "unit=[1,1,1];" + G.RET + unitMatrixExp + scaleExp;
			layerCopy.orientation.expression 		= layerRefExp + "unit=scale/100;" + G.RET + unitMatrixExp + YXZrotExp + "[ 0, radiansToDegrees(h), 0 ]";
			layerCopy.rotationX.expression 			= layerRefExp + "unit=scale/100;" + G.RET + unitMatrixExp + YXZrotExp + "radiansToDegrees(p)";
			layerCopy.rotation.expression 			= layerRefExp + "unit=scale/100;" + G.RET + unitMatrixExp + YXZrotExp + "radiansToDegrees(b)";
		}
	}
}

/*---------------------------------------------------------------------------------------------------------    
 MAIN
---------------------------------------------------------------------------------------------------------*/

/*-------------------*/
function main()
/*-------------------*/
{
	UI.main.progress.text="Checking...";									// initial error checks after pressing the export button
	var proj = app.project;
	if (!proj)
   {
		alert("Open a project first.");
		UI.main.progress.text="Ready.";
		return;
	}
	var comp = proj.activeItem;
	if (!comp || !(comp instanceof CompItem))
	{
		alert("A composition must be open and active");
		UI.main.progress.text="Ready.";
		return;
	}
	var selLayers = comp.selectedLayers;
	if (selLayers.length == 0)
	{
		alert("Please select the layers you want to export");
		UI.main.progress.text="Ready.";
		return;
	}
	var AllowAccess = app.preferences.getPrefAsLong("Main Pref Section", "Pref_SCRIPTING_FILE_NETWORK_SECURITY");
	if (AllowAccess == 0)
	{
		alert("ALERT!"+G.RET+
				"You need to check \"Allow Scripts to Write Files"+G.RET+
				"and Access Network\" in the General Preferences"+G.RET+
				"in order to use this plug in.");
		UI.main.progress.text="Ready.";
		return;
	}

	storeOriginalLayerNames (selLayers);									// the names of layers might need to be changed
	checkForBadLayerNames (selLayers);										// repeated names and long layer names are not allowed

	G.ORIGINAL_ASPECT = getPreciseCompPAR(comp);							// store original size (important for non square comps)
	G.WIDTH = comp.width;
	G.HEIGHT = comp.height;
	G.FPS = comp.frameRate

	app.beginUndoGroup("AE2Blender26 Export");
// ------------------------------------------------------------------------------------------------------------------------------------------------------- 
		UI.main.progress.text="Processing...";
		nonSquareToSquare(comp); 											// if comp is non-square, pin all unparented layers to world center and make it square
		writeHeader(comp); 													// write header into scene string
		for (var k=0; k<selLayers.length; k++) 							// go through selected layers one at a time
		{
			G.APPLY_TRACKTO	= false;										// Only apply trackTo modifier if a layer has autoOrient type of Camera.
			var layer = selLayers[k];
			UI.main.progress.text="Checking types...";
            checkLayerType(layer); 											// what type of layer is it?
			UI.main.progress.text="Checking for animation...";
			checkForAnimation (layer);										// what channels are animated?
			UI.main.progress.text="Cooking layer...";
            cookLayer (comp, layer); 										// make a copy of the selected layer, with world space values
			UI.main.progress.text="Fetching footage info...";
            if (layer.hasVideo == true)
            {
                getWidthHeightOfFootageItem (G.LAYER_SOURCE_NAME);          // Make sure we are comapring against the actual filename, not layer name.
            }
            else
            {
                getWidthHeightOfFootageItem (G.LAYER_NAME); 				// If this layer is a footage item, set the size of the footage found in the file, not comp layer size.
			}
            UI.main.progress.text="Fetching cooked data...";
            var data = new DataContainer(); 								// temporary storage for the keyframe data
			getData(comp, data); 											// get data from cooked layer and store it
			UI.main.progress.text="Writing...";
			writeThisLayerIntoScene(comp, data); 							// write data for this layer into the scene string
			resetComposition (comp, layer);									// restore original values, erase layer copies
		}		
		writeFooter(comp); 													// write footer into scene string
		UI.main.progress.text="Exporting...";
		write3DFile(); 														// take the scene string and put it into an ASCII file for 3D packages
		restoreLayerNames (selLayers)	;									// restores the layer names if they were changed
		squareToNonSquare(comp); 											// if it was non-square, return it to original size, and erase the center pin
		UI.main.progress.text="Done.";
// ------------------------------------------------------------------------------------------------------------------------------------------------------- 
	app.endUndoGroup();
}

/*---------------------------------------------------------------------------------------------------------    
 Entry Point - initialize global variables and load user interface
---------------------------------------------------------------------------------------------------------*/  
var G = new Object();
initGlobals(G);

var UI = new Object();
initUI(UI);
    
//****************************** END    
}
