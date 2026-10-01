// Vector construction based on the new LG Design references; transparent background.
export function logoMark(ink = '#8be2ef') {
  return `<g fill="${ink}"><path d="M12 14h10v32h27v10H12zM64 14h24v10H66q-8 0-8 8v6q0 8 8 8h12v-6H68V30h20v26H64q-16 0-16-17v-8q0-17 16-17z"/></g>`;
}
export function logoDimensions(ink = '#8be2ef') {
  return `<g stroke="${ink}" stroke-width=".8" fill="none"><path d="M12 2v9M88 2v9M12 7h76M4 14h7M4 56h7M7 14v42M91 14h7M91 56h7M95 14v42M12 59v9M88 59v9M12 64h76"/></g><g fill="${ink}"><path d="m12 7 5-2v4zm76 0-5-2v4zM7 14l-2 5h4zm0 42-2-5h4zM95 14l-2 5h4zm0 42-2-5h4zM12 64l5-2v4zm76 0-5-2v4z"/></g>`;
}
