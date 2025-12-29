#!/usr/bin/env python3
"""
FEA Visualization Script
Provides comprehensive visualization capabilities for finite element analysis
"""

import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import matplotlib.animation as animation

try:
    import pyvista as pv
    PYVISTA_AVAILABLE = True
    print("✓ PyVista available for advanced visualization")
except ImportError:
    PYVISTA_AVAILABLE = False
    print("⚠ PyVista not available, using matplotlib fallback")

try:
    import mayavi.mlab as mlab
    MAYAVI_AVAILABLE = True
    print("✓ Mayavi available for 3D visualization")
except ImportError:
    MAYAVI_AVAILABLE = False
    print("⚠ Mayavi not available")

def create_sample_fea_data():
    """Create sample FEA data for demonstration"""
    # Create a simple beam under load
    x = np.linspace(0, 1, 50)
    y = np.linspace(0, 0.1, 10)
    X, Y = np.meshgrid(x, y)

    # Simulate deflection (simplified beam theory)
    load_position = 0.5
    deflection = -(X**2) * (3 - 2*X) * 0.01 * np.exp(-((X - load_position)/0.1)**2)

    # Add some stress concentration
    stress = 1000 * (1 + np.sin(10*np.pi*X) * 0.1)

    return {
        'X': X,
        'Y': Y,
        'deflection': deflection,
        'stress': stress,
        'strain': deflection * 100  # Simplified strain calculation
    }

def matplotlib_visualization(data):
    """Create matplotlib-based visualizations"""
    fig = plt.figure(figsize=(15, 10))

    # Displacement plot
    ax1 = fig.add_subplot(221, projection='3d')
    surf1 = ax1.plot_surface(data['X'], data['Y'], data['deflection'],
                            cmap='viridis', alpha=0.8)
    ax1.set_title('Beam Deflection')
    ax1.set_xlabel('Length')
    ax1.set_ylabel('Height')
    ax1.set_zlabel('Displacement')
    fig.colorbar(surf1, ax=ax1, shrink=0.5)

    # Stress contour plot
    ax2 = fig.add_subplot(222)
    stress_contour = ax2.contourf(data['X'], data['Y'], data['stress'],
                                 cmap='RdYlBu_r', levels=20)
    ax2.set_title('Stress Distribution')
    ax2.set_xlabel('Length')
    ax2.set_ylabel('Height')
    fig.colorbar(stress_contour, ax=ax2)

    # Strain plot
    ax3 = fig.add_subplot(223)
    strain_plot = ax3.plot(data['X'][5, :], data['strain'][5, :], 'b-', linewidth=2)
    ax3.set_title('Strain Along Centerline')
    ax3.set_xlabel('Length')
    ax3.set_ylabel('Strain')
    ax3.grid(True)

    # Displacement profile
    ax4 = fig.add_subplot(224)
    disp_profile = ax4.plot(data['X'][5, :], data['deflection'][5, :], 'r-', linewidth=2)
    ax4.set_title('Displacement Profile')
    ax4.set_xlabel('Length')
    ax4.set_ylabel('Displacement')
    ax4.grid(True)

    plt.tight_layout()
    plt.show()

def pyvista_visualization(data):
    """Create advanced PyVista visualizations"""
    if not PYVISTA_AVAILABLE:
        print("⚠ PyVista not available, skipping advanced visualization")
        return

    # Create structured grid
    grid = pv.StructuredGrid(data['X'], data['Y'], data['deflection'])

    # Add scalar data
    grid['deflection'] = data['deflection'].flatten()
    grid['stress'] = data['stress'].flatten()

    # Create plotter
    plotter = pv.Plotter(shape=(2, 2))

    # Displacement surface
    plotter.subplot(0, 0)
    plotter.add_mesh(grid, scalars='deflection', cmap='viridis')
    plotter.add_title('Beam Deflection')

    # Stress surface
    plotter.subplot(0, 1)
    plotter.add_mesh(grid, scalars='stress', cmap='RdYlBu_r')
    plotter.add_title('Stress Distribution')

    # Contour plot
    plotter.subplot(1, 0)
    contours = grid.contour(scalars='deflection', isosurfaces=10)
    plotter.add_mesh(contours, opacity=0.5)
    plotter.add_mesh(grid.outline(), color='black')
    plotter.add_title('Displacement Contours')

    # Vector field (simplified)
    plotter.subplot(1, 1)
    # Create simple vectors
    vectors = np.zeros((grid.n_points, 3))
    vectors[:, 2] = data['deflection'].flatten() * 10  # Scale for visibility
    plotter.add_arrows(grid.points, vectors, mag=0.1)
    plotter.add_title('Displacement Vectors')

    plotter.show()

def mayavi_visualization(data):
    """Create Mayavi 3D visualizations"""
    if not MAYAVI_AVAILABLE:
        print("⚠ Mayavi not available, skipping 3D visualization")
        return

    # Create 3D surface plot
    mlab.figure('FEA Results')

    # Plot displacement surface
    surf = mlab.surf(data['X'], data['Y'], data['deflection'],
                     colormap='viridis')

    # Add colorbar
    mlab.colorbar(surf, title='Displacement')

    # Add axes and labels
    mlab.axes(xlabel='Length', ylabel='Height', zlabel='Displacement')
    mlab.title('Beam Deflection Analysis')

    mlab.show()

def create_animation(data):
    """Create animated visualization of FEA results"""
    fig = plt.figure(figsize=(12, 8))
    ax = fig.add_subplot(111, projection='3d')

    def animate(frame):
        ax.clear()
        # Simulate time-varying load
        time_factor = np.sin(frame * 0.1)
        displacement = data['deflection'] * (1 + 0.5 * time_factor)

        surf = ax.plot_surface(data['X'], data['Y'], displacement,
                              cmap='plasma', alpha=0.8)
        ax.set_title(f'FEA Animation - Frame {frame}')
        ax.set_xlabel('Length')
        ax.set_ylabel('Height')
        ax.set_zlabel('Displacement')
        return surf,

    ani = animation.FuncAnimation(fig, animate, frames=100,
                                interval=50, blit=False)

    plt.show()

def run_visualization():
    """Main visualization function"""
    print("🎨 Starting FEA Visualization")
    print("=" * 50)

    # Generate sample data
    data = create_sample_fea_data()
    print("✓ Generated sample FEA data")

    # Matplotlib visualization
    print("\n📊 Creating matplotlib visualizations...")
    matplotlib_visualization(data)

    # PyVista visualization
    if PYVISTA_AVAILABLE:
        print("\n🔬 Creating PyVista visualizations...")
        pyvista_visualization(data)

    # Mayavi visualization
    if MAYAVI_AVAILABLE:
        print("\n🎭 Creating Mayavi 3D visualizations...")
        mayavi_visualization(data)

    # Animation (optional)
    response = input("\n❓ Create animation? (y/n): ").lower().strip()
    if response == 'y':
        print("\n🎬 Creating animated visualization...")
        create_animation(data)

    print("=" * 50)
    print("✅ FEA Visualization Complete")

if __name__ == "__main__":
    run_visualization()