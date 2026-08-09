"use client"

import * as React from "react"
import { motion } from "motion/react"

import { MessageScrollerItem } from "@/components/ui/message-scroller"

export const MessageAnimated = motion.create(MessageScrollerItem)

export type MessageAnimatedProps = React.ComponentProps<typeof MessageAnimated>