# Fiducial Marker Placement Tool and Finder

## [Link to project's live hosted github-page](https://bbelk.github.io/ArUcoPlacementTool/)

## Table of contents
1. [Description](#description)
2. [How to use](#how-to-use)

## Description
This project is a minimalist image editor for placing fiducial markers such as ArUco and AprilTags into images. Generated markers can easily be placed, scaled, and have their selected dictionaries and IDs changed. The image editor also supports taking groups of generated markers, exporting to JSON, and re-importing for easily recreating precise layouts of markers for reusing on future images.

This project also includes a marker "finder", allowing you to hand select cells and automatically check either specific marker dictionaries or groupings of same grid size dictionaries for matching patterns. This feature is for scenarios in which you've lost the specific ID you're looking for, for identifying markers found in the wild, and also for fun!

This project currently supports:

### ArUco Dictionaries:
ArUco 4x4 1000, ArUco 5x5 1000, ArUco 6x6 1000, ArUco 7x7 1000, ArUco Default OpenCV, ArUco MIP 16h3, ArUco MIP 25h7

### AprilTag Dictionaries:
AprilTag 16h5, AprilTag 25h7, AprilTag 25h9, AprilTag 36h9, AprilTag 36h10, AprilTag 36h11

### Other Dictionaries:
ARTag, ARToolKitPlus, ARToolKitPlus BCH, Chilitags


## How to use
Coming soon!
<!-- ![Alt text](./readme-images/img1.gif "ArUco Placement How to use 1") -->



This project uses [js-aruco2](https://github.com/damianofalcioni/js-aruco2) by  Damiano Falcioni for generating markers with Javascript.

© 2024 Bruce Belk
