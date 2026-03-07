# CV Personal Statements Game

## Business Problem

Many trainees write impersonal CV Personal Statements. We want a fun way to test how personal their statements are during class.

This project provides a website where:

- A volunteer can start a game.
- Trainees can join a started game.
- Each trainee enters their name and personal statement from their CV.
- The game shows one statement at a time (without the name) along with a list of trainees.
- Trainees guess whose statement it is.
- After everyone votes, the next statement is shown.
- At the end, the game shows how personal each statement was based on correct guesses.

## Requirements

- Simple frontend and a backend to coordinate state across users.
- No long-term persistence. All game data should be deleted after the game ends or after 24 hours.
- Access control: probably a password for joining a game, set by the volunteer.
- Must be functional, accessible, tested, and easy for CodeYourFuture volunteers to deploy and maintain.

## Features

- Real-time multiplayer game for a classroom setting.
- Trainees can enter and guess personal statements.
- Volunteer can control and start the game.
- Scoring system shows which statements were personal vs. generic.

## Tech Stack

- Frontend: HTML, JavaScript, Tailwind CSS
- Backend: 
- Dev environment: Vite

