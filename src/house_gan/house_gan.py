from models import Generator
from torch.autograd import Variable
import torch
import numpy as np
from utils import bb_to_img, bb_to_vec, bb_to_seg, mask_to_bb, remove_junctions, ID_COLOR, bb_to_im_fid


room_names = ['Living room', 'Kitchen', 'Bedroom', 'Bathroom', 'Missing', 'Closet', 'Balcony', 'Corridor', 'Dining room', 'Laundry room']

def build_nodes_tensor(nodes):
    rows = []
    for node in nodes:
        cols = []
        rows.append(cols)
        for i in range(10):
            cols.append(1.0 if node == i else 0.0)
    return torch.tensor(rows, dtype=torch.float)


def has_edge(a, b, edges):
    for edge in edges:
        if (edge[0] == a and edge[1] == b) or (edge[0] == b and edge[1] == a):
            return True
    return False


def build_edges_tensor(edges):
    rows = []
    for a in range(9):
        for b in range(a + 1, 10):
            cols = []
            rows.append(cols)
            cols.append(a)
            cols.append(1 if has_edge(a, b, edges) else -1)
            cols.append(b)
    return torch.tensor(rows, dtype=torch.long)


def generate_floorplans(nodes, edges, num_variations=4, use_gpu=False):
    latent_dim = 128

    generator = Generator()
    checkpoint = 'exp_demo_D_500000.pth'
    processor_type = 'gpu' if use_gpu else 'cpu'
    generator.load_state_dict(torch.load(
        checkpoint, map_location=torch.device(processor_type)))

    cuda = True if torch.cuda.is_available() else False
    if cuda:
        generator.cuda()

    Tensor = torch.cuda.FloatTensor if cuda else torch.FloatTensor

    nodes = Variable(nodes.type(Tensor))

    floorplans = []
    for i in range(num_variations):
        z = Variable(Tensor(np.random.normal(0, 1, (10, latent_dim))))
        with torch.no_grad():
            gen_mks = generator(z, nodes, edges)
            gen_bbs = np.array([np.array(mask_to_bb(mk))
                                for mk in gen_mks.detach().cpu()])
        gen_bbs = gen_bbs[np.newaxis, :, :]/32.0
        floorplans.append(gen_bbs)
    return floorplans


def generate_floorplan_files(nodes, edges, num_variations=4, use_gpu=False):
    nodes_tensor = build_nodes_tensor(nodes)
    edges_tensor = build_edges_tensor(edges)

    floorplans = generate_floorplans(
        nodes_tensor, edges_tensor, num_variations=num_variations, use_gpu=use_gpu)

    for i, bounding_boxes in enumerate(floorplans):
        image = bb_to_im_fid(bounding_boxes, nodes,
                             im_size=256).convert('RGBA')
        image.save(f'output/floorplan_{i}.png')
        generate_rhino_file(bounding_boxes[0], nodes, i)


def generate_rhino_file(bounding_boxes, nodes, index, size=300):
    # Use rhino3dm https://github.com/mcneel/rhino3dm
    print(f'Floorplan {index + 1}')
    for (x0, y0, x1, y1), node in zip(bounding_boxes, nodes):
        # Some bounding boxes are showing up as (0, 0), (0, 0) so removing them
        if x0 < 0 or y0 < 0 or x1 < 0 or y1 < 0 or (x0 == x1 and y0 == y1):
            continue
        else:
            room_name = room_names[node]
            print(f'  {room_name}: (({x0 * size}, {y0 * size}), ({x1 * size}, {y1 * size}))')


def test():
    nodes = [3, 1, 1, 3, 1, 2, 2, 5, 5, 6]
    edges = [[0, 1], [0, 3], [0, 4], [1, 2], [1, 4], [2, 4], [2, 5], [2, 6], [2, 7], [
        3, 4], [3, 5], [4, 5], [5, 7], [5, 8], [5, 9], [6, 7], [6, 8], [6, 9], [7, 8], [8, 9]]
    generate_floorplan_files(nodes, edges)


if __name__ == '__main__':
    test()
