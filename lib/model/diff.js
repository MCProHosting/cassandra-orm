var eq = require('deep-equal');
var arrayDiff = require('array-diff')();

/**
 * Updates a set-type column.
 *
 * @param  {UpdateQuery} builder
 * @param  {String} key
 * @param  {Object} left
 * @param  {Object} right
 */
function diffSet (query, column, left, right) {
    // Make a copy of the right items.
    var additions = right.slice();
    var subtractions = [];

    // Go through every left item. Mark items that were deleted.
    var i, l;
    for (i = 0, l = left.length; i < l; i++) {
        var value = left[i];
        var index = additions.indexOf(value);

        if (index === -1) {
            // Remove the item if it's no longer present.
            subtractions.push(value);
        } else {
            // If it is, remove it from the "additions"
            additions.splice(index, 1);
        }
    }

    // If we updated most every value, just rewrite it.
    // todo: actual benchmarks here
    if (additions.length + subtractions.length > left.length * 0.75) {
        return query.setSimple(column, right);
    }

    // Now add/remove the necessary.
    if (additions.length) {
        query.add(column, additions);
    }
    if (subtractions.length) {
        query.subtract(column, subtractions);
    }
}

/**
 * Updates a map-type column.
 *
 * @param  {UpdateQuery} builder
 * @param  {String} key
 * @param  {Object} left
 * @param  {Object} right
 */
function diffMap (query, column, left, right) {
    var removed = [];
    var updates = {};
    var updated = false;

    var key;
    // Look through all the keys in the db.
    for (key in left) {
        // Remove it if it's no longer present.
        if (typeof right[key] === 'undefined') {
            removed.push(key);
        }
        // Or update it if it's different.
        else if (!eq(right[key], left[key])) {
            updated = true;
            updates[key] = right[key];
        }
    }
    // Then loop back and see what keys we need to add.
    for (key in right) {
        if (typeof left[key] === 'undefined') {
            updated = true;
            updates[key] = right[key];
        }
    }

    // Update things and remove other things
    if (updated) {
        query.add(column, updates);
    }
    if (removed.length) {
        query.subtract(column, removed);
    }
}

/**
 * Updates a list-type column. This is designed to tend to safeness
 * rather than towards highest performance.
 *
 * That is, internal edits within the list will result in the list being
 * rewritten rather than that index being edited, as it is very possible
 * that the list order has shifted or it has been rewritten since the
 * last update.
 *
 * @param  {UpdateQuery} builder
 * @param  {String} key
 * @param  {Object} left
 * @param  {Object} right
 */
function diffList (query, column, left, right) {
    var diff = arrayDiff(left, right);
    var i, l;

    // Check out the deletions in the array. If all of one value was
    // removed, we can .subtract, but if there were duplicates and
    // only one instance was removed, we must rewrite the list.
    var deletions = [];
    for (i = 0, l = diff.length; i < l; i++) {
        var deleted = deletions.indexOf(diff[i][1]);
        // If we haven't seen this deleted item before, add it.
        if (diff[i][0] === '-' && deleted === -1) {
            deletions.push(diff[i][1]);
        }
        // But if we did see it before and this time it's not deleted,
        // rewrite.
        else if (diff[i][0] !== '-' && deleted !== -1) {
            return query.setSimple(column, right);
        }
    }
    // And look over the array backwards to get deletions at the end.
    // Perhaps not incredibly graceful, but it is O(n) rather than O(n^2).
    // At the same time, look for elements that were appended to the array.
    var appends = [];
    var isAppending = true;
    for (i = diff.length - 1; i >= 0; i--) {
        // If it appears in deleted but is not marked for deletion, it's
        // a duplicate and we should rewrite.
        if (diff[i][0] !== '-' && deletions.indexOf(diff[i][1]) !== -1) {
            return query.setSimple(column, right);
        }

        if (isAppending) {
            if (diff[i][0] === '+') {
                appends.push(diff[i][1]);
            } else {
                isAppending = false;
            }
        }
    }
    // Reverse it (we looked over the list backwards)
    appends = appends.reverse();

    // Now loop for prepends and watch for internal additions within the
    // array. If any do occur, we rewrite the array (see docstring)
    var prepends = [];
    var isPrepending = true;
    for (i = 0, l = diff.length - appends.length; i < l; i++) {
        if (isPrepending) {
            if (diff[i][0] === '+') {
                prepends.push(diff[i][1]);
            } else {
                isPrepending = false;
            }
        }
        // not an "else" statement so we run this check on the iteration
        // we switch isPrepending to be false
        if (!isPrepending && diff[i][0] === '+') {
            return query.setSimple(column, right);
        }
    }
    // Reverse the prepends
    prepends = prepends.reverse();

    // If we updated most every value, just rewrite it.
    // todo: actual benchmarks here
    if (deletions.length + appends.length + prepends.length > left.length * 0.75) {
        return query.setSimple(column, right);
    }

    // At this point, we're good, so run all the updates!
    if (deletions.length) {
        query.subtract(column, deletions);
    }
    if (appends.length) {
        query.add(column, appends);
    }
    if (prepends.length) {
        query.add(prepends, column);
    }
}

/**
 * Adds updates to the query builder necessary to update the "old"
 * attribute to match the "new".
 *
 * @param  {UpdateQuery} builder
 * @param  {String} key
 * @param  {Object} left
 * @param  {Object} right
 */
module.exports = function (query, column, left, right) {
    // If they're deeply equal, do nothing.
    if (eq(left, right)) {
        return;
    }
    // If one of the columns is null, it's a simple set. We're
    // either setting from null to something (no diff to make) or
    // making something equal null.
    else if (left === null || right === null) {
        query.setSimple(column, right);
    }
    // For 'set' collections...
    else if (column.isCollection && column.type === 'set') {
        diffSet(query, column, left, right);
    }
    // For 'list' collections...
    else if (column.isCollection && column.type === 'list') {
        diffList(query, column, left, right);
    }
    // For 'map' collections...
    else if (column.isCollection && column.type === 'map') {
        diffMap(query, column, left, right);
    }
    // If they're dates...
    else if (left instanceof Date && right instanceof Date) {
        query.setSimple(column, right);
    }
    // Or just set it simply
    else {
        query.setSimple(column, right);
    }
};
