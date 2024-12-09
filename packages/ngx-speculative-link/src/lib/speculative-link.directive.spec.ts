import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SpeculativeLink } from './speculative-link.directive';
import { By } from '@angular/platform-browser';
import { SpeculativeLinkRegistry } from './speculative-link-registry.service';

@Component({
  standalone: true,
  template: ` <a [speculativeLink]="testRef()"></a> `,
  imports: [SpeculativeLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestHostComponent {
  testRef = input<string>();
}

fdescribe('SpeculativeLink Directive', () => {
  let hostFixture: ComponentFixture<TestHostComponent>;
  let speculativeLink: SpeculativeLink;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
    });

    hostFixture = TestBed.createComponent(TestHostComponent);
    speculativeLink = hostFixture.debugElement
      .query(By.directive(SpeculativeLink))
      .injector.get(SpeculativeLink);
  });

  it('should create host component and speculative link directive', () => {
    hostFixture.autoDetectChanges();

    expect(hostFixture.componentInstance).toBeDefined();
    expect(speculativeLink).toBeDefined();
  });

  it('should parseRef', () => {
    const parseRefSpy = jest.spyOn(speculativeLink, 'parseRef');

    hostFixture.autoDetectChanges();

    expect(parseRefSpy).toHaveBeenCalledWith(null);
    parseRefSpy.mockReset();

    hostFixture.componentRef.setInput('testRef', 'DUMMY_REF');
    hostFixture.autoDetectChanges();

    expect(parseRefSpy).toHaveBeenCalledWith('DUMMY_REF');
    parseRefSpy.mockReset();

    hostFixture.componentRef.setInput('testRef', undefined);
    hostFixture.autoDetectChanges();

    expect(parseRefSpy).toHaveBeenCalledWith(null);
  });

  it('should should not register invalid speculative links with invalid paths', () => {
    const registry = TestBed.inject(SpeculativeLinkRegistry);

    const registerSpy = jest.spyOn(registry, 'register');
    hostFixture.autoDetectChanges();

    expect(registerSpy).not.toHaveBeenCalled();
  });

  it('should register speculative links with valid paths', () => {
    hostFixture.componentRef.setInput('testRef', 'DUMMY_REF');
    const registry = TestBed.inject(SpeculativeLinkRegistry);

    const registerSpy = jest.spyOn(registry, 'register');
    hostFixture.autoDetectChanges();

    expect(registerSpy).toHaveBeenCalledWith(speculativeLink);
  });

  it('should unregister speculative links when path becomes invalid', () => {
    const registry = TestBed.inject(SpeculativeLinkRegistry);
    const registerSpy = jest.spyOn(registry, 'register');
    const unregisterSpy = jest.spyOn(registry, 'unregister');

    hostFixture.componentRef.setInput('testRef', 'DUMMY_REF');
    hostFixture.autoDetectChanges();
    expect(registerSpy).toHaveBeenCalledWith(speculativeLink);

    hostFixture.componentRef.setInput('testRef', undefined);
    hostFixture.autoDetectChanges();
    expect(unregisterSpy).toHaveBeenCalledWith(speculativeLink);
  });

  it('should unregister when component is destroyed', () => {
    const registry = TestBed.inject(SpeculativeLinkRegistry);
    const registerSpy = jest.spyOn(registry, 'register');
    const unregisterSpy = jest.spyOn(registry, 'unregister');

    hostFixture.componentRef.setInput('testRef', 'DUMMY_REF');
    hostFixture.autoDetectChanges();
    expect(registerSpy).toHaveBeenCalledWith(speculativeLink);

    hostFixture.componentRef.destroy();
    hostFixture.autoDetectChanges();
    expect(unregisterSpy).toHaveBeenCalledWith(speculativeLink);
  });
});
