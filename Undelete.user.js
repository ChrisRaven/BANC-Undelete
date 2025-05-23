// ==UserScript==
// @name         Undelete
// @namespace    BANC
// @version      0.1.3.1
// @description  Adds 50 steps to bring back removed segments
// @author       Krzysztof Kruk
// @match        https://spelunker.cave-explorer.org/
// @updateURL    https://raw.githubusercontent.com/ChrisRaven/BANC-Undelete/main/Undelete.user.js
// @downloadURL  https://raw.githubusercontent.com/ChrisRaven/BANC-Undelete/main/Undelete.user.js
// @grant        none
// ==/UserScript==

/* global viewer, BigInt */

(function() {
  'use strict';

  const MAX_LENGTH = 50

  const undeleteButton = document.createElement('button')
  undeleteButton.id = 'undelete'

  function getLS() {
    const deleted = localStorage.getItem('BANC-deleted')
    return deleted && deleted.length ? JSON.parse(deleted) : []
  }

  function setLS(deleted) {
    if (!deleted) return
    localStorage.setItem('BANC-deleted', JSON.stringify(deleted))
  }

  const checkForViewer = setInterval(() => {
    if (typeof viewer === 'undefined') return

    clearInterval(checkForViewer)

    setTimeout(() => {
      document.getElementsByClassName('neuroglancer-annotation-tool-status')[0].after(undeleteButton)

      viewer.selectedLayer.layer_.layer_.displayState.segmentationGroupState.value.selectedSegments.changed.add((segId, added) => {
        if (added) return
        if (Array.isArray(segId)) return
        segId = segId.toString()

        if (segId.length !== 18) return

        const deleted = getLS()
        if (deleted && deleted[deleted.length - 1] === segId) return

        if (deleted.length >= MAX_LENGTH) {
          deleted.shift()
        }
        deleted.push(segId)
        setLS(deleted)
        updateCounter(deleted)
      })

      document.getElementById('undelete').addEventListener('click', e => {
        const deleted = getLS()
        if (!deleted.length) return

        const segId = BigInt(deleted.pop())
        viewer.selectedLayer.layer_.layer_.displayState.segmentationGroupState.value.selectedSegments.add(segId)
        viewer.selectedLayer.layer_.layer_.displayState.segmentationGroupState.value.visibleSegments.add(segId)
        setLS(deleted)
        updateCounter(deleted)
      })

      updateCounter(getLS())
    }, 500)
  }, 100)


  function updateCounter(arr) {
    undeleteButton.textContent = `Undelete (${arr.length})`
    undeleteButton.disabled = !arr.length
  }


})()