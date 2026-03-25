"""Seaside Static - a weird little retro arcade shooter."""

from __future__ import annotations

import math
import random
import sys
from dataclasses import dataclass, field

import pygame

LOGICAL_SIZE = (320, 180)
WINDOW_SCALE = 4
WINDOW_SIZE = (LOGICAL_SIZE[0] * WINDOW_SCALE, LOGICAL_SIZE[1] * WINDOW_SCALE)
FPS = 60
PLAYER_SPEED = 210
BULLET_SPEED = 360
ENEMY_BULLET_SPEED = 150
ROUND_TIME = 75

BG = (11, 12, 32)
MAGENTA = (255, 76, 196)
CYAN = (80, 255, 240)
NEON_YELLOW = (255, 222, 89)
SEA = (36, 82, 162)
SAND = (212, 139, 91)
WHITE = (241, 244, 255)
RED = (255, 91, 119)
PURPLE = (130, 88, 255)
BLACK = (0, 0, 0)


@dataclass
class Star:
    x: float
    y: float
    speed: float
    radius: int


@dataclass
class Bullet:
    x: float
    y: float
    vx: float
    vy: float
    color: tuple[int, int, int]
    radius: int = 2
    friendly: bool = True

    def update(self, dt: float) -> None:
        self.x += self.vx * dt
        self.y += self.vy * dt

    def draw(self, surface: pygame.Surface) -> None:
        pygame.draw.rect(
            surface,
            self.color,
            pygame.Rect(int(self.x) - 1, int(self.y) - 3, self.radius + 2, 6),
        )


@dataclass
class Particle:
    x: float
    y: float
    vx: float
    vy: float
    color: tuple[int, int, int]
    life: float
    size: int

    def update(self, dt: float) -> None:
        self.x += self.vx * dt
        self.y += self.vy * dt
        self.life -= dt

    def draw(self, surface: pygame.Surface) -> None:
        if self.life > 0:
            pygame.draw.rect(surface, self.color, (int(self.x), int(self.y), self.size, self.size))


@dataclass
class Enemy:
    kind: str
    x: float
    y: float
    vx: float
    vy: float
    wobble: float
    hp: int
    score: int
    cooldown: float = field(default_factory=lambda: random.uniform(0.6, 1.8))
    age: float = 0.0

    @property
    def radius(self) -> int:
        return {"gull": 10, "crab": 9, "icecream": 11}[self.kind]

    def update(self, dt: float) -> None:
        self.age += dt
        self.x += self.vx * dt
        self.y += self.vy * dt
        self.y += math.sin(self.age * self.wobble) * 18 * dt
        self.cooldown -= dt

    def draw(self, surface: pygame.Surface) -> None:
        px = int(self.x)
        py = int(self.y)
        if self.kind == "gull":
            pygame.draw.polygon(surface, WHITE, [(px - 10, py), (px, py - 6), (px + 10, py)])
            pygame.draw.rect(surface, MAGENTA, (px - 4, py - 2, 8, 6))
            pygame.draw.rect(surface, NEON_YELLOW, (px + 8, py - 1, 5, 2))
        elif self.kind == "crab":
            pygame.draw.rect(surface, RED, (px - 8, py - 5, 16, 10))
            pygame.draw.rect(surface, RED, (px - 12, py - 9, 4, 4))
            pygame.draw.rect(surface, RED, (px + 8, py - 9, 4, 4))
            pygame.draw.rect(surface, CYAN, (px - 5, py - 2, 2, 2))
            pygame.draw.rect(surface, CYAN, (px + 3, py - 2, 2, 2))
        else:
            pygame.draw.rect(surface, PURPLE, (px - 7, py + 1, 14, 8))
            pygame.draw.rect(surface, WHITE, (px - 6, py - 6, 12, 8))
            pygame.draw.rect(surface, MAGENTA, (px - 2, py - 11, 4, 5))
            pygame.draw.rect(surface, CYAN, (px - 6, py - 3, 12, 2))


@dataclass
class Player:
    x: float = 44
    y: float = LOGICAL_SIZE[1] // 2
    cooldown: float = 0.0
    lives: int = 3
    blink: float = 0.0

    def draw(self, surface: pygame.Surface) -> None:
        if self.blink > 0 and int(self.blink * 15) % 2 == 0:
            return
        px = int(self.x)
        py = int(self.y)
        pygame.draw.rect(surface, CYAN, (px - 10, py - 5, 18, 10))
        pygame.draw.rect(surface, MAGENTA, (px - 2, py - 8, 12, 4))
        pygame.draw.rect(surface, NEON_YELLOW, (px - 14, py - 2, 4, 4))
        pygame.draw.rect(surface, WHITE, (px + 8, py - 2, 5, 4))
        pygame.draw.rect(surface, WHITE, (px - 4, py - 1, 4, 2))


def make_enemy() -> Enemy:
    kind = random.choice(["gull", "crab", "icecream"])
    x = LOGICAL_SIZE[0] + random.randint(8, 40)
    y = random.randint(26, LOGICAL_SIZE[1] - 28)
    vx = -random.uniform(60, 120)
    vy = random.uniform(-16, 16)
    wobble = random.uniform(3.0, 8.0)
    hp = {"gull": 1, "crab": 2, "icecream": 3}[kind]
    score = {"gull": 50, "crab": 90, "icecream": 140}[kind]
    return Enemy(kind=kind, x=x, y=y, vx=vx, vy=vy, wobble=wobble, hp=hp, score=score)


def draw_background(surface: pygame.Surface, stars: list[Star], tick: int) -> None:
    surface.fill(BG)
    pygame.draw.circle(surface, MAGENTA, (245, 42), 26)
    pygame.draw.circle(surface, NEON_YELLOW, (245, 42), 18)
    pygame.draw.rect(surface, SEA, (0, 92, LOGICAL_SIZE[0], 48))
    pygame.draw.rect(surface, SAND, (0, 140, LOGICAL_SIZE[0], 40))

    for i in range(6):
        wave_y = 104 + i * 4
        color = CYAN if i % 2 == 0 else WHITE
        for x in range(0, LOGICAL_SIZE[0], 18):
            pygame.draw.line(surface, color, (x, wave_y), (x + 10, wave_y), 1)

    for star in stars:
        pygame.draw.rect(surface, WHITE, (int(star.x), int(star.y), star.radius, star.radius))

    cabinet = pygame.Rect(4, 4, LOGICAL_SIZE[0] - 8, LOGICAL_SIZE[1] - 8)
    pygame.draw.rect(surface, (63, 31, 13), cabinet, 4)
    pygame.draw.rect(surface, (135, 84, 46), cabinet.inflate(-8, -8), 2)

    for y in range(0, LOGICAL_SIZE[1], 3):
        shade = 12 + ((y + tick // 4) % 6)
        pygame.draw.line(surface, (shade, shade, shade, 30), (8, y), (LOGICAL_SIZE[0] - 8, y))


def draw_hud(surface: pygame.Surface, font: pygame.font.Font, score: int, lives: int, timer_value: float, combo: int) -> None:
    items = [
        (f"SCORE {score:05d}", CYAN, 14),
        (f"LIVES {lives}", NEON_YELLOW, 122),
        (f"TIME {max(0, math.ceil(timer_value)):02d}", MAGENTA, 202),
    ]
    for text, color, x in items:
        surface.blit(font.render(text, False, color), (x, 12))
    if combo > 1:
        surface.blit(font.render(f"CHAIN x{combo}", False, WHITE), (112, 28))


def draw_overlay(surface: pygame.Surface, title_font: pygame.font.Font, small_font: pygame.font.Font, score: int, high_score: int, started: bool) -> None:
    panel = pygame.Rect(42, 34, 236, 112)
    pygame.draw.rect(surface, (20, 12, 44), panel)
    pygame.draw.rect(surface, MAGENTA, panel, 3)
    pygame.draw.rect(surface, CYAN, panel.inflate(-10, -10), 2)

    title = "SEASIDE STATIC"
    subtitle = "FADED CAFE ARCADE"
    prompt = "PRESS SPACE TO PLAY" if not started else "PRESS SPACE TO PLAY AGAIN"
    surface.blit(title_font.render(title, False, NEON_YELLOW), (62, 52))
    surface.blit(small_font.render(subtitle, False, CYAN), (95, 74))
    surface.blit(small_font.render("BLAST GULLS, CRABS & HAUNTED ICE CREAMS", False, WHITE), (48, 95))
    surface.blit(small_font.render(prompt, False, MAGENTA), (95, 115))
    surface.blit(small_font.render("ARROWS/WASD MOVE  SPACE SHOOTS", False, WHITE), (74, 129))
    surface.blit(small_font.render(f"SCORE {score:05d}  HI {high_score:05d}", False, NEON_YELLOW), (88, 143))


def spawn_burst(particles: list[Particle], x: float, y: float, color: tuple[int, int, int], amount: int = 10) -> None:
    for _ in range(amount):
        angle = random.uniform(0, math.tau)
        speed = random.uniform(20, 90)
        particles.append(
            Particle(
                x=x,
                y=y,
                vx=math.cos(angle) * speed,
                vy=math.sin(angle) * speed,
                color=color,
                life=random.uniform(0.2, 0.5),
                size=random.randint(1, 3),
            )
        )


def main() -> None:
    pygame.init()
    pygame.display.set_caption("Seaside Static")
    window = pygame.display.set_mode(WINDOW_SIZE, pygame.RESIZABLE)
    clock = pygame.time.Clock()

    scene = pygame.Surface(LOGICAL_SIZE)
    font = pygame.font.SysFont("couriernew", 12, bold=True)
    title_font = pygame.font.SysFont("couriernew", 18, bold=True)
    small_font = pygame.font.SysFont("couriernew", 10, bold=True)

    stars = [
        Star(random.randint(8, LOGICAL_SIZE[0] - 8), random.randint(8, 78), random.uniform(6, 18), random.randint(1, 2))
        for _ in range(34)
    ]

    high_score = 0

    def reset_game() -> tuple[Player, list[Bullet], list[Enemy], list[Particle], float, float, int, int, bool]:
        return Player(), [], [], [], 0.0, ROUND_TIME, 0, 1, True

    player, bullets, enemies, particles, spawn_timer, round_timer, score, combo, playing = reset_game()
    started_once = False

    while True:
        dt = min(clock.tick(FPS) / 1000, 0.033)
        tick = pygame.time.get_ticks()

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                raise SystemExit
            if event.type == pygame.KEYDOWN and event.key == pygame.K_SPACE and not playing:
                player, bullets, enemies, particles, spawn_timer, round_timer, score, combo, playing = reset_game()
                started_once = True

        keys = pygame.key.get_pressed()
        if playing:
            mx = (keys[pygame.K_RIGHT] or keys[pygame.K_d]) - (keys[pygame.K_LEFT] or keys[pygame.K_a])
            my = (keys[pygame.K_DOWN] or keys[pygame.K_s]) - (keys[pygame.K_UP] or keys[pygame.K_w])
            length = math.hypot(mx, my) or 1
            player.x += (mx / length) * PLAYER_SPEED * dt if mx or my else 0
            player.y += (my / length) * PLAYER_SPEED * dt if mx or my else 0
            player.x = max(24, min(124, player.x))
            player.y = max(28, min(LOGICAL_SIZE[1] - 28, player.y))

            player.cooldown -= dt
            player.blink = max(0.0, player.blink - dt)
            round_timer -= dt
            spawn_timer -= dt

            if (keys[pygame.K_SPACE] or keys[pygame.K_RETURN]) and player.cooldown <= 0:
                bullets.append(Bullet(player.x + 14, player.y, BULLET_SPEED, 0, NEON_YELLOW, friendly=True))
                bullets.append(Bullet(player.x + 10, player.y - 5, BULLET_SPEED * 0.9, -35, CYAN, friendly=True))
                bullets.append(Bullet(player.x + 10, player.y + 5, BULLET_SPEED * 0.9, 35, MAGENTA, friendly=True))
                player.cooldown = 0.19

            if spawn_timer <= 0:
                enemies.append(make_enemy())
                if score > 700:
                    enemies.append(make_enemy())
                spawn_timer = max(0.25, 0.9 - min(0.55, score / 5000))

            for star in stars:
                star.x -= star.speed * dt
                if star.x < 8:
                    star.x = LOGICAL_SIZE[0] - 8
                    star.y = random.randint(8, 78)

            for bullet in bullets:
                bullet.update(dt)
            bullets = [b for b in bullets if -8 <= b.x <= LOGICAL_SIZE[0] + 8 and 0 <= b.y <= LOGICAL_SIZE[1]]

            for enemy in enemies:
                enemy.update(dt)
                if enemy.cooldown <= 0 and enemy.x < LOGICAL_SIZE[0] - 18:
                    spread = random.uniform(-50, 50)
                    bullets.append(Bullet(enemy.x - 10, enemy.y, -ENEMY_BULLET_SPEED, spread, RED, radius=3, friendly=False))
                    enemy.cooldown = random.uniform(0.9, 2.1)
            enemies = [e for e in enemies if e.x > -24]

            for bullet in bullets[:]:
                if bullet.friendly:
                    for enemy in enemies[:]:
                        if math.hypot(bullet.x - enemy.x, bullet.y - enemy.y) < enemy.radius + 4:
                            if bullet in bullets:
                                bullets.remove(bullet)
                            enemy.hp -= 1
                            spawn_burst(particles, enemy.x, enemy.y, bullet.color, 5)
                            if enemy.hp <= 0:
                                score += enemy.score * combo
                                combo = min(9, combo + 1)
                                high_score = max(high_score, score)
                                spawn_burst(particles, enemy.x, enemy.y, random.choice([MAGENTA, CYAN, NEON_YELLOW]), 16)
                                enemies.remove(enemy)
                            break
                elif player.blink <= 0 and math.hypot(bullet.x - player.x, bullet.y - player.y) < 12:
                    bullets.remove(bullet)
                    player.lives -= 1
                    combo = 1
                    player.blink = 1.6
                    spawn_burst(particles, player.x, player.y, RED, 18)

            for enemy in enemies[:]:
                if player.blink <= 0 and math.hypot(enemy.x - player.x, enemy.y - player.y) < enemy.radius + 9:
                    enemies.remove(enemy)
                    player.lives -= 1
                    combo = 1
                    player.blink = 1.6
                    spawn_burst(particles, player.x, player.y, RED, 18)

            for particle in particles:
                particle.update(dt)
            particles = [p for p in particles if p.life > 0]

            if not enemies and combo > 1:
                combo = 1

            if player.lives <= 0 or round_timer <= 0:
                playing = False
                high_score = max(high_score, score)

        draw_background(scene, stars, tick)

        for bullet in bullets:
            bullet.draw(scene)
        for enemy in enemies:
            enemy.draw(scene)
        player.draw(scene)
        for particle in particles:
            particle.draw(scene)

        draw_hud(scene, font, score, player.lives, round_timer, combo)
        scene.blit(small_font.render("TOKYO POP MEETS RUSTY PIER", False, WHITE), (86, 160))

        if not playing:
            draw_overlay(scene, title_font, small_font, score, high_score, started_once)

        scaled = pygame.transform.scale(scene, window.get_size())
        window.blit(scaled, (0, 0))
        pygame.display.flip()


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        pass
    except Exception as exc:
        pygame.quit()
        print(f"Arcade cabinet malfunction: {exc}", file=sys.stderr)
        raise
