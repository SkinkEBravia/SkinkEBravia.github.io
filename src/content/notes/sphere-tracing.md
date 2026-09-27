---
title: "Sphere tracing, briefly"
description: "Why marching by the distance field is safe, and what goes wrong when the field lies."
date: 2026-09-27
topic: "Rendering"
---

## Setup

A signed distance function $f:\mathbb{R}^3 \to \mathbb{R}$ returns, for every point, the distance
to the nearest surface: negative inside, positive outside. For a ray
$\mathbf{r}(t) = \mathbf{o} + t\,\mathbf{d}$ with $\|\mathbf{d}\| = 1$, sphere tracing iterates

$$
t_{i+1} = t_i + f(\mathbf{r}(t_i)),
$$

stopping when $f < \varepsilon$ (a hit) or $t > t_{\max}$ (a miss).

## Why it never overshoots

The step is safe whenever $f$ is **1-Lipschitz**:

$$
|f(\mathbf{x}) - f(\mathbf{y})| \le \|\mathbf{x} - \mathbf{y}\| .
$$

At a point with $f(\mathbf{x}) = d$, the open ball of radius $d$ around $\mathbf{x}$ contains no
surface. A step of length $d$ along any direction therefore stays in empty space.

## When the field lies

Many useful shapes are only *bounds*, not true distances: smooth unions, domain warps, and
implicit surfaces like the gyroid $|\sin x \cos y + \sin y \cos z + \sin z \cos x|$. If the
Lipschitz constant is $L > 1$, dividing by it restores safety:

$$
t_{i+1} = t_i + \frac{f(\mathbf{r}(t_i))}{L}.
$$

In practice a fixed relaxation factor ($0.5$ to $0.8$) is a cheap stand-in for $1/L$, trading
speed for fewer holes and less banding.

## Normals for free

Near the surface, $\nabla f$ points outward. Central differences give the normal:

$$
\mathbf{n} \approx \operatorname{normalize}\big(f(\mathbf{p}+h\mathbf{e}_x) - f(\mathbf{p}-h\mathbf{e}_x),\ \dots\big).
$$

Six extra evaluations per hit. The tetrahedral trick needs four.
