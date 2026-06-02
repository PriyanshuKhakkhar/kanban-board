import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BoardService, Board } from '../../core/services/board.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-boards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './boards.component.html',
  styleUrls: ['./boards.component.scss']
})
export class BoardsComponent {
  boards$!: Observable<Board[]>;
  constructor(private boardService: BoardService, private router: Router) {
    this.boards$ = this.boardService.boards$;
  }

  openBoard(b: Board) {
    this.boardService.setActive(b.id);
    this.router.navigate(['/dashboard']);
  }
}
