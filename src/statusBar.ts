import * as vscode from 'vscode';
import { TrendBoard, TrendItem } from './trend/types';

export class StatusBarManager implements vscode.Disposable {
  private item: vscode.StatusBarItem;
  private timer?: ReturnType<typeof setInterval>;
  private carouselItems: TrendItem[] = [];
  private carouselIndex = 0;

  constructor() {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.item.command = 'hotSearch.openSidebar';
    this.item.text = '$(flame) 热搜';
    this.item.show();
  }

  updateFromBoard(board: TrendBoard): void {
    if (board.id !== 'realtime') return;
    this.carouselItems = board.items.filter((i) => !i.isPinned);
    if (this.carouselItems.length === 0) {
      this.item.text = '$(flame) 热搜';
      return;
    }
    this.carouselIndex = 0;
    this.renderCurrent();
    this.restartCarousel();
  }

  private renderCurrent(): void {
    const current = this.carouselItems[this.carouselIndex];
    if (!current) return;
    const title = current.title.length > 30 ? `${current.title.slice(0, 30)}…` : current.title;
    this.item.text = `$(flame) ${title}`;
    this.item.tooltip = `#${current.rank} ${current.title}`;
  }

  private restartCarousel(): void {
    if (this.timer) clearInterval(this.timer);
    const seconds = vscode.workspace.getConfiguration('hotSearch').get<number>('carouselInterval', 5);
    this.timer = setInterval(() => {
      if (this.carouselItems.length === 0) return;
      this.carouselIndex = (this.carouselIndex + 1) % this.carouselItems.length;
      this.renderCurrent();
    }, seconds * 1000);
  }

  onConfigChanged(): void {
    this.restartCarousel();
  }

  dispose(): void {
    if (this.timer) clearInterval(this.timer);
    this.item.dispose();
  }
}
