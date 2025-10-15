import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RobotPage } from './robot.page';

describe('RobotPage', () => {
  let component: RobotPage;
  let fixture: ComponentFixture<RobotPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RobotPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
