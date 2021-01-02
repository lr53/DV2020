/*-------------------------------------------------------------------- 

   Module: REF 14 Results Dashboard - Dendogram

   References: Code taken and adapted from
          - F21DV Live Examples 
          - Mike Bostock"s Examples

---------------------------------------------------------------------- */
var hierarchyGraph; //The graph of objects used to represent the hierachy

function tree(targetDOMelement) { 
	//Here we use a function declaration to imitate a 'class' definition
	//
	//Invoking the function will return an object (treeObject)
	//    e.g. tree_instance = tree(target)
	//    This also has the 'side effect' of appending an svg to the target element 
	//
	//The returned object has attached public and private methods (functions in JavaScript)
	//For instance calling method 'updateAndRenderData()' on the returned object 
	//(e.g. tree_instance) will render a tree to the svg
	
	
	

	//Delare the main object that will be returned to caller
	var treeObject = {};
	
	//=================== PUBLIC FUNCTIONS =========================
	//
		
	treeObject.loadAndRenderDataset = function (jsonHierarchy) {
		//Loads and renders a standard (format 1) d3 JSON hierarchy in "d3Hierarchy" or "name-children" format
		
		datasetAsJsonD3Hierarchy=jsonHierarchy;
		//Transform into list of nodes into d3 hierarchy object
		hierarchyGraph = d3.hierarchy(datasetAsJsonD3Hierarchy)
							.sort((a,b) => a.height - b.height);
		addTreeXYdataAndRender(hierarchyGraph);
		return treeObject; //for method chaining
	} 
	
	//=================== PRIVATE VARIABLES ====================================
	
	//Declare and append SVG element
	var margin = {top: 20, right: 200, bottom: 20, left: 50},
	width = 1200 - margin.right - margin.left,
	height = 600 - margin.top - margin.bottom;

	//Set up SVG and append group to act as container for tree graph
	var grp = d3.select(targetDOMelement).append("svg")
		.attr("width", width + margin.right + margin.left)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + (width / 2 - 15) + "," + (height / 2 + 25) + ")");

	//Add group for the nodes, just for clarity in viewing the svg
	var nodesGroup = grp
		.append("g")
		.classed("nodesGroup", true);

	//Add group for the links, just for clarity in viewing the svg
	var linksGroup = grp
		.append("g")
		.classed("linksGroup", true);
 
	var datasetAsJsonD3Hierarchy; //Hierarchy in JSON form (suitable for use in d3.hierarchy 
//	var hierarchyGraph; //The graph of objects used to represent the hierachy
	var clickedNode; //This is the 'clicked' node in a collapse or uncollapse animation
	var listOfNodes; //To be rendered


	//=================== PRIVATE FUNCTIONS ====================================

	var clickFunction = function (clickedNode,i){

		if (clickedNode.children) {
			hideChildren(clickedNode)
		}
		else {
			//Reveal children
			revealChildren(clickedNode);
			
			//Store the position of the clicked node 
			//so that we can use it as the starting position 
			//for the revealed children in the GUP Node Enter Selection
			clickedNode.xAtEndPreviousGUPrun = clickedNode.x; 
			clickedNode.yAtEndPreviousGUPrun = clickedNode.y;	
		}
		
		//Now calculate new x,y positions for all visible nodes and render in GUP
		calculateXYpositionsAndRender(hierarchyGraph, clickedNode);
	}
	
	function hideChildren(node) {
		if (node.children) { 
			node._children = node.children;
			node.children = null;
		} 
	}
	
	function revealChildren(node) {
		if (node._children) { 		
			node.children = node._children;
			node._children = null;
		}
	}
	
	function hideUnhideChildren(d) {
		var clickedNode = d;
		if (clickedNode.children) { 
			//Hide children
			clickedNode._children = d.children;
			clickedNode.children = null;

		} else {
			//Reveal children
			clickedNode.children = clickedNode._children;
			clickedNode._children = null;
			clickedNode.xAtEndPreviousGUPrun = clickedNode.x; 
			clickedNode.yAtEndPreviousGUPrun = clickedNode.y;		}
	}

	var nodeLabel = function(d) {return d.data.id;}

	function addTreeXYdataAndRender(hierarchyGraph){
		
		var rootNode = hierarchyGraph;

		//Set 'clicked node' node to root of hierarchy to start
		//as we want all nodes to appear from the root on startup
		clickedNode = rootNode;

		//And set it's 'previous' position to (0,0) as we'll 
		//start drawing from there
		clickedNode.xAtEndPreviousGUPrun=clickedNode.yAtEndPreviousGUPrun=0;

		//Now we'll hide all nodes except the root and the next level down 
		//to dreate a compact tree to start the dashboard
		rootNode.descendants().forEach(node => {if(node.depth - 0) hideChildren(node)})

		//Add (x,y) positions of all visible nodes and render
		calculateXYpositionsAndRender(hierarchyGraph, clickedNode);

	}
	
	function calculateXYpositionsAndRender(hierarchyGraph, clickedNode){
		//Note that the 'clickedNode' is the clicked node in a collapse or
		//uncollapse animation
		//For a colapse, we want all children of the clicked node converge upon the
		//the clicked node's final position (in the current GUP animation) and then exit.
		
		//get and setup the tree layout generator 
		var myTreeLayoutGenerator = d3.cluster().size([200, 280])
									.separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

		//Add the newly calculated x and y properies to each node
		//in the hierarcy graph.
		var hierarchyGraphWithPositions = myTreeLayoutGenerator(hierarchyGraph);

		//Get lists of nodes and links
		var listOfLinksByDescendants = hierarchyGraphWithPositions.descendants().slice(1);
		listOfNodes = hierarchyGraphWithPositions.descendants(); //Note that the x,y values are the 
													//final positions we want for the graph
													//i.e. values after transitions

		//Render links and nodes
		GUPrenderLinks(listOfLinksByDescendants, clickedNode);
		GUPrenderNodes(listOfNodes, clickedNode);		

	}


	function GUPrenderNodes(listOfNodes, clickedNode){
		
		//DATA BIND
		var selection = nodesGroup
			.selectAll("g.cssClassNode") //select groups with class = "cssClassNode"
			.data(listOfNodes, generateUniqueKey);		

		//ENTER  
		var enterSelection = selection
			.enter()
			.append("g")
			.attr("class", d=> {if(d.data.id) return "nest-key--"+d.data.id.replace(/[\W]+/g,"_"); else return "No key";})
			.classed("cssClassNode enterSelection", true)
			.on("click", clickFunction);
			
		//transitions
		enterSelection	
			.attr("transform", function(d) { 
				//
				//We have two situations where we have nodes in the Enter Selection
				//   a) after  invocation of addTreeXYdataAndRender() we have to render
				//      the new hierarchy.
				//   b) after a node 'click' event that causes an a node to be expanded
				//      (or un-collapsed) then the Enter Selection will contain all the 
				//      (previously hidden) child nodes of the clicked node. 
				//      In this case we need to first set (transform) these newly revealed nodes to suitable 
				//      'start positions', and only then transform them into the final
				//      positions as determined by the last run of the d3.tree layout algorithm.
				//      The 'start positions' of newly revealed children are set to the position of
				//		their parent (i.e. the clicked node) when it was clicked .
				return "translate(" + (0, 0) + ")"; 
			})
			//Transition to final entry positions
			.transition()
			.duration(2000)
			.attr("transform", function(d) { 
				return "translate(" + project(d.x, d.y)+ ")"; 
			});	
			
		//Append nodes
		enterSelection
			.append("circle")
			.attr("r", d => 10);
			
		//Append holders for leaf node labels
		enterSelection
			.append("text")

		//UPDATE 
		selection
			//On update we simply want to update the classes 
			//and transition to new positions
			.classed("enterSelection", false)
			.classed("updateSelection", true)
			.transition()
			.duration(2000)
			.attr("transform", function(d) { 
				return "translate(" + project(d.x, d.y) + ")"; 
			});
			

		//ENTER + UPDATE 
		enterUpdateSelectionGroup = enterSelection.merge(selection)
			
		enterUpdateSelectionGroup
			//set appropriate classes for the group
			.classed("leafNode", d => d.height == 0)
			.classed("rootNode", d => d.depth == 0)
			.classed("intermediateNode", d => (d.height != 0 && d.depth != 0));
		
		enterUpdateSelectionGroup
			//add label text to the text elements within the groups
			.select("text")
				.text(nodeLabel);


		// EXIT 
		selection
			.exit()
			.classed("enterSelection updateSelection", false)
			.classed("exitSelection", true)
			//Move departing nodes to clicked node and remove.
			.transition()
			.duration(2000)
			.attr("transform", function(d) {
				d.x =  Number(clickedNode.x); 
				d.y =  Number(clickedNode.y);
				return "translate(" + project(d.x, d.y) + ")";
			})
			.remove();
	}
	
	function GUPrenderLinks(listOfLinksByDescendants, clickedNode){
		
		// DATA JOIN
		var selection = linksGroup
			.selectAll("path.cssClassLink")
			.data(listOfLinksByDescendants, generateUniqueKey);
			
		//ENTER 
		var enterSel = selection
			.enter()
			.append('path')
			.attr("id", (d, i) => "link key "+d.key)
			.classed("cssClassLink enterSelection", true);
		enterSel
			.attr('d', function(d){
				var o = {x:Number(clickedNode.xAtEndPreviousGUPrun), y:Number(clickedNode.yAtEndPreviousGUPrun)}
				return diagonalShapeGenerator2(o, o);
			})
			.transition()
			.duration(2000)
			.attr("d", diagonalShapeGenerator1);
			
		// UPDATE
		selection
			.classed("enterSelection", false)
			.classed("updateSelection", false)			
			.transition()
			.duration(2000)
			.attr("d", diagonalShapeGenerator1);
		
		// EXIT 
		selection
			.exit()
			.classed("enterSelection updateSelection", false)
			.classed("exitSelection", false)
			.transition()
			.duration(2000)
			.attr('d', function(d){
				return diagonalShapeGenerator2(clickedNode, clickedNode);
			})
			.remove();			
	}


	//Define the diagonal path shape generator function
	function diagonalShapeGenerator1(d){
		source = d.parent;
		descendant = d;
		return diagonalShapeGenerator2(source, descendant);
	}	
	
	//Define the diagonal path shape generator function
	function diagonalShapeGenerator2(source, descendant){
		return "M" + project(source.x, source.y)
			+ "C" + project(source.x, (source.y + descendant.y) / 2)
			+ " " + project(descendant.x, (source.y + descendant.y) / 2) 
			+ " " + project(descendant.x, descendant.y);
	}	
	
	//Define key generator
	var lastKey=0;
	function generateUniqueKey(d) {
		//If no key then generate new unique key, assign it, and return to caller 
		if(!d.hasOwnProperty("key")) d.key = ++lastKey;
		return d.key;
	}
	
	function project(x, y) {
  var angle = (x - 180) / 90 * Math.PI, radius = y;
  return [radius * Math.cos(angle), radius * Math.sin(angle)];
}
	
	//================== IMPORTANT do not delete ==================================
	return treeObject; // return the main object to the caller to create an instance of the 'class'
	
} //End of tree() declaration	