# Strategies

The planner applies these strategies to produce resolved recipes to be instantiated in the Arc.

## InitPopulation
Loads recipes from arc's recipe index. If contextual planning is requested,
only recipes that match handles or slots of the active recipe are returned.<br/>
[init-population.js](https://github.com/PolymerLabs/arcs/blob/master/runtime/strategies/init-population.js)

## ConvertConstraintsToConnections
Converts connection constraints (eg ParticleA.handleA -> particleB.handleB) in the recipe into actual particles and handle connections.
Note: arrow direction are ignored at this time.<br/>
[convert-constraints-to-connections.js](https://github.com/PolymerLabs/arcs/blob/master/runtime/strategies/convert-constraints-to-connections.js)

## AssignHandles
Maps recipe handle to a local or remote store with a matching type and tags.<br/>
[assign-handles.js](https://github.com/PolymerLabs/arcs/blob/master/runtime/strategies/assign-handles.js)

## AddMissingHandles
Creates a new recipe handle with a “?” fate for each handle connection that is not bound to a recipe handle.
The strategy is not executed on recipes with outstanding constraints or with free handles (ie handle with no corresponding handle connections).<br/>
[add-missing-handles.js](https://github.com/PolymerLabs/arcs/blob/master/runtime/strategies/add-missing-handles.js)

## CreateHandleGroup
Creates a new 'create' handle connecting a broadest possible set of unresolved connections.
Will never connect 2 connections from the same particle and requires at least one writing and one reading particle.<br/>
[create-handle-group.js](https://github.com/PolymerLabs/arcs/blob/master/runtime/strategies/create-handle-group.js)

## MapSlots
Maps consumed slots with provided slots within the same recipe and pre existing slots (provided by slot-composer).<br/>
[map-slots.js](https://github.com/PolymerLabs/arcs/blob/master/runtime/strategies/map-slots.js)

## InitSearch
Extracts search query from the arc and sets the search phrase in the recipe.<br/>
[init-search.js](https://github.com/PolymerLabs/arcs/blob/master/runtime/strategies/init-search.js)

## SearchTokensToParticles
Convert unresolved search tokens (from arc’s search query) to particles and add particles to the recipe.
The particles are matched by name and primary verb.<br/>
[search-tokens-to-particles.js](https://github.com/PolymerLabs/arcs/blob/master/runtime/strategies/search-tokens-to-particles.js)

## GroupHandleConnections
Group together handle connections of different particles that are not bound to any handles with other handle connections of the same type.
Handle connections of the same particle must be bound to different handles. If several handles of the same type exist, the preference is to group “in” connections with “out” ones.<br/>
[group-handle-connections.js](https://github.com/PolymerLabs/arcs/blob/master/runtime/strategies/group-handle-connections.js)

## CombinedStrategy
Run several strategy in a single transaction.
Each strategy is performed on leaf results of previously executed strategies. Only the leaf-results are returned to the strategizer.

Currently this strategy is used to execute SearchTokensToParticles together with GroupHandleConnections (that otherwise causes explosion of recipes in next generations).<br/>
[combined-strategy.js](https://github.com/PolymerLabs/arcs/blob/master/runtime/strategies/combined-strategy.js)

## MatchParticleByVerb
For recipe particles identified by verb rather than name, find particles matching the given verbs and names them.<br/>
[match-particle-by-verb.js](https://github.com/PolymerLabs/arcs/blob/master/runtime/strategies/match-particle-by-verb.js)

## NameUnnamedConnections
Names unnamed connections of a particle based on its spec.<br/>
[name-unnamed-connections.js](https://github.com/PolymerLabs/arcs/blob/master/runtime/strategies/name-unnamed-connections.js)

## CoalesceRecipes
Merges 2 unresolved terminal recipes and connects them through merging one unresolved handle from each recipe.
Handles that are merged need to be one of use/map/copy fate, connected to particles on both sides, and need to facilitate communication (everyone writing or everyone reading is not valid) and have connections of types and directions that allow such merge.
[coalesce-recipes.js](https://github.com/PolymerLabs/arcs/blob/master/runtime/strategies/coalesce-recipes.js)

## FindHostedParticle
Finds a matching particle for an unresolved _host_ connection.<br/>
[find-hosted-particle.js](https://github.com/PolymerLabs/arcs/blob/master/runtime/strategies/find-hosted-particle.js)
