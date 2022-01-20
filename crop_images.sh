#!/bin/bash

# 75x55

# 1093x825

IMAGE_X=1093
IMAGE_Y=825

FRAME_X=75
FRAME_Y=55


convert src/webstatic/questplay/frame.png \
  -crop $(($FRAME_X))x$(($FRAME_Y*3))+$((0))+$((0)) src/webstatic/questplay/frame-left-top.png

convert src/webstatic/questplay/frame.png \
  -crop $(($FRAME_X*2))x$(($FRAME_Y))+$(($FRAME_X))+$((0)) src/webstatic/questplay/frame-left-top-2.png

convert src/webstatic/questplay/frame.png \
  -crop $(($IMAGE_X - $FRAME_X*6))x$(($FRAME_Y))+$(($FRAME_X*3))+$((0)) src/webstatic/questplay/frame-top.png

convert src/webstatic/questplay/frame.png \
  -crop $(($FRAME_X*2))x$(($FRAME_Y))+$(($IMAGE_X - $FRAME_X*3))+$((0)) src/webstatic/questplay/frame-right-top-2.png

convert src/webstatic/questplay/frame.png \
  -crop $(($FRAME_X))x$(($FRAME_Y*3))+$(($IMAGE_X - $FRAME_X))+$((0)) src/webstatic/questplay/frame-right-top.png


convert src/webstatic/questplay/frame.png \
  -crop $(($FRAME_X))x$(($IMAGE_Y - $FRAME_Y*6))+$((0))+$(($FRAME_Y*3)) src/webstatic/questplay/frame-left.png

convert src/webstatic/questplay/frame.png \
  -crop $(($FRAME_X))x$(($IMAGE_Y - $FRAME_Y*6))+$(($IMAGE_X - $FRAME_X))+$(($FRAME_Y*3)) src/webstatic/questplay/frame-right.png



convert src/webstatic/questplay/frame.png \
  -crop $(($FRAME_X))x$(($FRAME_Y*3))+$((0))+$(($IMAGE_Y - $FRAME_Y*3)) src/webstatic/questplay/frame-left-bottom.png

convert src/webstatic/questplay/frame.png \
  -crop $(($FRAME_X*2))x$(($FRAME_Y))+$(($FRAME_X))+$(($IMAGE_Y - $FRAME_Y)) src/webstatic/questplay/frame-left-bottom-2.png

convert src/webstatic/questplay/frame.png \
  -crop $(($IMAGE_X - $FRAME_X*6))x$(($FRAME_Y))+$(($FRAME_X*3))+$(($IMAGE_Y - $FRAME_Y)) src/webstatic/questplay/frame-bottom.png

convert src/webstatic/questplay/frame.png \
  -crop $(($FRAME_X*2))x$(($FRAME_Y))+$(($IMAGE_X - $FRAME_X*3))+$(($IMAGE_Y - $FRAME_Y)) src/webstatic/questplay/frame-right-bottom-2.png

convert src/webstatic/questplay/frame.png \
  -crop $(($FRAME_X))x$(($FRAME_Y*3))+$(($IMAGE_X - $FRAME_X))+$(($IMAGE_Y - $FRAME_Y*3)) src/webstatic/questplay/frame-right-bottom.png
