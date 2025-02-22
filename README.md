# UDIScheduler

This project was created as a classroom project at UDI. The goal of this repository is to be adopted by the university itself to manage the scheduling of computing rooms. This project also aims to be a tool for students to learn about software development and project management in future classes.

## Structure

The project is divided into the `packages` and `apps` folders.

* The [`packages`](./packages/README.md) folder contains shareable code that can be used across all the apps to avoid code duplication.
* The [`apps`](./apps/README.md) folder contains the applications that will be used by the end-users, like frontend and backend.

## Getting started

You must have the following tools installed in order to run this project correctly:

* [Bun](https://bun.sh/)
* [Docker](https://www.docker.com/)

### Steps
<!-- WIP: Check for future steps and add them -->

1. Clone this repository

```bash
git clone https://github.com/pulgueta/udischeduler
```

2. Install the dependencies

```bash
cd udischeduler
bun install
```

3. Run the project

```bash
bun dev
```