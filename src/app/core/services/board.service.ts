import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Task { title: string }

export interface Board {
  id: number;
  name: string;
  createdAt: string;
  columns?: {
    todo: Task[];
    inprogress: Task[];
    review: Task[];
    done: Task[];
  };
}

@Injectable({ providedIn: 'root' })
export class BoardService {
  private boardsSubject = new BehaviorSubject<Board[]>([]);
  boards$ = this.boardsSubject.asObservable();
  private activeSubject = new BehaviorSubject<Board | null>(null);
  active$ = this.activeSubject.asObservable();

  get boards() {
    return this.boardsSubject.getValue();
  }

  addBoard(board: Board) {
    const b: Board = {
      ...board,
      columns: {
        todo: [],
        inprogress: [],
        review: [],
        done: []
      }
    };
    const next = [...this.boards, b];
    this.boardsSubject.next(next);
    // set newly created board as active
    this.activeSubject.next(b);
  }

  setActive(boardId: number) {
    const found = this.boards.find(b => b.id === boardId) || null;
    this.activeSubject.next(found);
  }

  addTask(boardId: number, column: keyof NonNullable<Board['columns']>, title: string) {
    const boards = this.boards.map(b => {
      if (b.id !== boardId) return b;
      const copy: Board = { ...b, columns: { ...(b.columns as any) } };
      (copy.columns as any)[column] = [
        ...((copy.columns as any)[column] || []),
        { title }
      ];
      return copy;
    });
    this.boardsSubject.next(boards);
    // update active if it was the same board
    const active = this.activeSubject.getValue();
    if (active && active.id === boardId) {
      const updated = boards.find(x => x.id === boardId) || null;
      this.activeSubject.next(updated);
    }
  }
}
