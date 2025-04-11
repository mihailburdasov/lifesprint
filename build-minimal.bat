@echo off
echo Renaming index.tsx to index.tsx.bak
ren src\index.tsx index.tsx.bak

echo Renaming index.minimal.tsx to index.tsx
ren src\index.minimal.tsx index.tsx

echo Running build
call npm run build

echo Restoring original files
ren src\index.tsx index.minimal.tsx
ren src\index.tsx.bak index.tsx

echo Build completed
